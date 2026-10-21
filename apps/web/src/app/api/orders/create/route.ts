// ============================================================
// API: Criar pedido
// POST /api/orders/create
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma, type Prisma } from '@becker/db';
import { notifyOrder } from '@/lib/notify';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { getActiveProvider, mercadopagoLib } from '@/lib/payments';
import { verificarCupom, calcularDesconto } from '@/lib/cupom';
import { markAsConverted } from '@/lib/cart-recovery';
import { createCardPaymentForOrder } from '@/lib/payments/order-preference';

function genOrderNumber() {
  const now = new Date();
  return `BKR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900000) + 100000)}`;
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 req / hora por IP
  const limited = checkRateLimit(req, LIMITS.CREATE_ORDER);
  if (limited) return limited;

  try {
    const data = await req.json();
    const { whatsapp, name, email, cep, street, number, complement, neighborhood, city, state,
            shipping, paymentMethod, cupom, items } = data;

    if (!whatsapp || !name || !cep || !items?.length) {
      return NextResponse.json({ ok: false, error: 'Dados incompletos' }, { status: 400 });
    }

    // Validar paymentMethod (não pode ser inválido)
    const validPaymentMethods = ['pix', 'credit_card'];
    const safePaymentMethod = validPaymentMethods.includes(paymentMethod) ? paymentMethod : 'pix';

    // Validar shippingMethod (deve ser do enum)
    const shippingMap: Record<string, 'free' | 'pac' | 'sedex'> = {
      free: 'free',
      standard: 'pac',
      express: 'sedex',
    };
    const safeShippingMethod = shippingMap[shipping?.id] || 'free';

    // Validar quantidades
    for (const i of items as Array<{ qty?: unknown }>) {
      if (typeof i.qty !== 'number' || !Number.isInteger(i.qty) || i.qty < 1 || i.qty > 99) {
        return NextResponse.json({ ok: false, error: 'Quantidade inválida' }, { status: 400 });
      }
    }

    // Calcular totais
    // SPRINT 11: Suporte a kits (item.isKit = true, versionId = "kit-{slug}")
    const regularVersionIds = items
      .filter((i: { isKit?: boolean; versionId: string }) => !i.isKit && i.versionId)
      .map((i: { isKit?: boolean; versionId: string }) => i.versionId);
    const kitSlugs = items
      .filter((i: { isKit?: boolean; versionId: string }) => i.isKit && i.versionId?.startsWith('kit-'))
      .map((i: { isKit?: boolean; versionId: string }) => i.versionId.replace(/^kit-/, ''));

    const [versions, kits] = await Promise.all([
      regularVersionIds.length > 0
        ? prisma.productVersion.findMany({
            where: { id: { in: regularVersionIds }, active: true, product: { active: true } },
            include: { product: true },
          })
        : Promise.resolve([]),
      kitSlugs.length > 0
        ? prisma.kit.findMany({
            where: { slug: { in: kitSlugs }, isActive: true },
            include: { items: true },
          })
        : Promise.resolve([]),
    ]);

    const vMap = new Map(versions.map((v) => [v.id, v]));
    const kMap = new Map(kits.map((k) => [k.slug, k]));

    let subtotal = 0;
    // Cada item regular vira 1 entry; cada kit vira 1 entry com kitItems aninhado
    const orderItemsData: Prisma.OrderItemUncheckedCreateWithoutOrderInput[] = [];
    // Mapa de kitSlug → lista de OrderItemKitItem
    const kitItemsByKitSlug: Record<string, Record<string, unknown>[]> = {};

    for (const item of items) {
      if (item.isKit) {
        // Item é um kit
        const kitSlug = item.versionId?.replace(/^kit-/, '');
        const kit = kMap.get(kitSlug);
        if (!kit) {
          return NextResponse.json({ ok: false, error: 'Kit indisponível' }, { status: 400 });
        }
        const price = Number(kit.price);
        if (!(price > 0)) {
          return NextResponse.json({ ok: false, error: 'Kit indisponível' }, { status: 400 });
        }
        const total = price * item.qty;
        subtotal += total;

        // Snapshot dos itens do kit (pro pedido manter histórico)
        const kitItemSnapshots = kit.items.map((ki) => ({
          productId: ki.productId,
          productName: ki.productName,
          versionId: ki.versionId,
          versionLabel: ki.versionLabel,
          qty: ki.qty * item.qty,
          unitPrice: 0, // preço unitário não é exposto no kit
        }));
        kitItemsByKitSlug[kit.slug] = kitItemSnapshots;

        orderItemsData.push({
          productId: kit.id, // usa o id do kit como productId
          versionId: kit.id, // fallback
          productName: kit.name,
          versionLabel: `Kit com ${kit.items.length} ${kit.items.length === 1 ? 'item' : 'itens'}`,
          sku: `KIT-${kit.slug.toUpperCase()}`,
          price,
          qty: item.qty,
          total,
          kitId: kit.id,
          // Nested create dos kitItems
          kitItems: { create: kitItemSnapshots },
        });
      } else {
        // Item regular
        const v = vMap.get(item.versionId);
        if (!v) {
          return NextResponse.json({ ok: false, error: 'Produto indisponível' }, { status: 400 });
        }
        const price = Number(v.price);
        if (!(price > 0)) {
          return NextResponse.json({ ok: false, error: `Produto indisponível: ${v.product.name}` }, { status: 400 });
        }
        if (v.stock < item.qty) {
          return NextResponse.json({ ok: false, error: `Estoque insuficiente: ${v.product.name}` }, { status: 400 });
        }
        const total = price * item.qty;
        subtotal += total;
        orderItemsData.push({
          productId: v.productId,
          versionId: v.id,
          productName: v.product.name,
          versionLabel: v.label,
          sku: v.sku,
          price,
          qty: item.qty,
          total,
        });
      }
    }

    // Validar cupom se informado
    let discount = 0;
    let freeShipping = false;
    if (cupom) {
      const c = await prisma.coupon.findUnique({ where: { code: String(cupom).toUpperCase() } });
      if (!c) {
        return NextResponse.json({ ok: false, error: 'Cupom não encontrado' }, { status: 400 });
      }
      const check = verificarCupom(c, subtotal);
      if (!check.ok) {
        return NextResponse.json({ ok: false, error: check.error }, { status: 400 });
      }
      // Incremento atômico e condicional: evita ultrapassar maxUses em pedidos simultâneos
      const claimed = await prisma.coupon.updateMany({
        where: {
          id: c.id,
          active: true,
          ...(c.maxUses !== null ? { usedCount: { lt: c.maxUses } } : {}),
        },
        data: { usedCount: { increment: 1 } },
      });
      if (claimed.count === 0) {
        return NextResponse.json({ ok: false, error: 'Cupom esgotado' }, { status: 400 });
      }
      discount = calcularDesconto(c, subtotal);
      if (c.type === 'shipping') freeShipping = true;
    }

    const shippingPrice = freeShipping ? 0 : shipping?.price || 0;
    const total = Math.max(0, subtotal - discount + shippingPrice);

    // Buscar ou criar usuário
    const whatsappFormatted = `(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`;
    let user = await prisma.user.findFirst({
      where: { whatsapp: { in: [whatsappFormatted, whatsapp] } },
    });

    if (!user) {
      // Criar novo
      const { randomBytes } = await import('crypto');
      const id = randomBytes(12).toString('hex');
      user = await prisma.user.create({
        data: {
          id,
          name,
          whatsapp: whatsappFormatted,
          email: email || null,
          role: 'CUSTOMER',
        },
      });
    } else if (name && user.name !== name) {
      // Atualizar nome se mudou
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, email: email || user.email },
      });
    }

    // Criar ou atualizar endereço
    let address = await prisma.address.findFirst({
      where: {
        userId: user.id,
        cep,
        street,
        number,
      },
    });

    if (!address) {
      const { randomBytes } = await import('crypto');
      const id = randomBytes(12).toString('hex');
      address = await prisma.address.create({
        data: {
          id,
          userId: user.id,
          cep,
          street,
          number,
          complement: complement || null,
          district: neighborhood,
          city,
          state,
          isDefault: true,
        },
      });
    }

    // Criar pedido
    const { randomBytes } = await import('crypto');
    const orderId = randomBytes(12).toString('hex');
    const order = await prisma.order.create({
      data: {
        id: orderId,
        number: genOrderNumber(),
        userId: user.id,
        addressId: address.id,
        subtotal,
        shipping: shippingPrice,
        discount,
        total,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        paymentMethod: safePaymentMethod,
        source: 'SITE',
        shippingMethod: safeShippingMethod,
        items: {
          create: orderItemsData.map((i) => ({
            ...i,
            id: randomBytes(12).toString('hex'),
          })),
        },
      },
    });

    // Marcar carrinho como convertido (Sprint 9)
    try {
      await markAsConverted(whatsappFormatted, order.id);
    } catch (e) {
      console.error('Erro ao marcar carrinho como convertido:', e);
    }

    // ============== MERCADO PAGO ==============
    // Se MP está configurado e o método é PIX, cria pagamento agora
    let payment: { paymentId?: string; qrCode?: string; qrCodeBase64?: string; ticketUrl?: string; expirationDate?: string; initPoint?: string; error?: string } = {};
    const provider = await getActiveProvider();

    if (provider === 'mercadopago' && safePaymentMethod === 'pix') {
      try {
        const mpResult = await mercadopagoLib.createPixPayment({
          orderId: order.id,
          orderNumber: order.number,
          total,
          customer: {
            name,
            email: email || undefined,
            whatsapp: whatsappFormatted,
          },
          expirationMinutes: 30,
        });

        if (mpResult.ok) {
          payment = {
            paymentId: mpResult.paymentId,
            qrCode: mpResult.qrCode,
            qrCodeBase64: mpResult.qrCodeBase64,
            ticketUrl: mpResult.ticketUrl,
            expirationDate: mpResult.expirationDate,
          };

          // Salva paymentId no pedido
          await prisma.order.update({
            where: { id: order.id },
            data: { paymentId: mpResult.paymentId },
          });
        } else {
          console.error('[mercadopago] Falha ao criar pagamento:', mpResult.error);
          // Continua mesmo assim - pedido criado, admin pode gerar pagamento manual
        }
      } catch (e) {
        console.error('[mercadopago] Exceção ao criar pagamento:', e);
      }
    }

    // Cartão: Checkout Pro do Mercado Pago (o cliente é redirecionado ao initPoint)
    if (provider === 'mercadopago' && safePaymentMethod === 'credit_card') {
      try {
        const card = await createCardPaymentForOrder(order.id);
        if (card.initPoint) {
          payment = { initPoint: card.initPoint };
        } else {
          payment = { error: card.error || 'Não foi possível iniciar o pagamento com cartão agora.' };
        }
      } catch (e) {
        console.error('[mercadopago] Exceção ao criar preferência:', e instanceof Error ? e.message : e);
        payment = { error: 'Não foi possível iniciar o pagamento com cartão agora. Seu pedido foi registrado; tente de novo em instantes.' };
      }
    }

    // Enviar WhatsApp de confirmação (depois de saber se há link de pagamento)
    try {
      await notifyOrder({ orderId: order.id, event: 'order_created', paymentLink: payment.initPoint });
    } catch (e) {
      console.error('Erro ao enviar WhatsApp:', e);
    }

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.number,
      payment,
    });
  } catch (e: unknown) {
    console.error('Order create error:', e instanceof Error ? e.message : 'erro desconhecido');
    return NextResponse.json({ ok: false, error: 'Erro ao criar o pedido. Tente novamente.' }, { status: 500 });
  }
}
