// ============================================================
// API: Criar pedido
// POST /api/orders/create
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { sendWhatsApp } from '@/lib/whatsapp-client';
import { getSession } from '@/lib/auth/session';
import { notifyOrder } from '@/lib/notify';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { getActiveProvider, mercadopagoLib } from '@/lib/payments';

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

    // Calcular totais
    const versionIds = items.map((i: any) => i.versionId);
    const versions = await prisma.productVersion.findMany({
      where: { id: { in: versionIds } },
      include: { product: true },
    });

    const vMap = new Map(versions.map((v) => [v.id, v]));

    let subtotal = 0;
    const orderItems: any[] = [];
    for (const item of items) {
      const v = vMap.get(item.versionId);
      if (!v) continue;
      const price = Number(v.price);
      const total = price * item.qty;
      subtotal += total;
      orderItems.push({
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

    // Validar cupom se informado
    let discount = 0;
    let couponId: string | null = null;
    if (cupom) {
      const c = await prisma.coupon.findUnique({ where: { code: cupom.toUpperCase() } });
      if (c && c.active) {
        couponId = c.id;
        if (c.type === 'percent') discount = subtotal * (Number(c.value) / 100);
        else if (c.type === 'fixed') discount = Number(c.value);
        // Incrementar uso
        await prisma.coupon.update({
          where: { id: c.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    const shippingPrice = shipping?.price || 0;
    const total = subtotal - discount + shippingPrice;

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
        items: { create: orderItems.map((i) => ({ ...i, id: randomBytes(12).toString('hex') })) },
      },
    });

    // Enviar WhatsApp de confirmação (template padronizado)
    try {
      await notifyOrder({ orderId: order.id, event: 'order_created' });
    } catch (e) {
      console.error('Erro ao enviar WhatsApp:', e);
    }

    // ============== MERCADO PAGO ==============
    // Se MP está configurado e o método é PIX, cria pagamento agora
    let payment: { paymentId?: string; qrCode?: string; qrCodeBase64?: string; ticketUrl?: string; expirationDate?: string } = {};
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

    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderNumber: order.number,
      payment,
    });
  } catch (e: any) {
    console.error('Order create error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
