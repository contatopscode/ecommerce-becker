// ============================================================
// Cart Recovery - Carrinho Abandonado
// Sprint 9: detecta carrinhos abandonados e envia WhatsApp (1h, 24h, 72h)
// ============================================================

import 'server-only';
import { prisma } from '@becker/db';
import { sendWhatsApp, normalizeWhatsAppNumber } from '@/lib/whatsapp-client';

// ============== TIPOS ==============

export interface CartItem {
  productId: string;
  name: string;
  versionId: string;
  versionLabel: string;
  price: number;
  qty: number;
  image?: string;
}

export interface SaveCartInput {
  whatsapp: string;
  customerName?: string;
  items: CartItem[];
  cupom?: string;
}

// ============== SAVE CART ==============

/**
 * Salva/atualiza carrinho do cliente
 * Chamado pelo frontend quando cliente digita WhatsApp no checkout
 */
export async function saveCart(input: SaveCartInput): Promise<{ ok: boolean; cartId?: string; error?: string }> {
  if (!input.whatsapp || !input.items?.length) {
    return { ok: false, error: 'WhatsApp e itens obrigatórios' };
  }

  const cleaned = input.whatsapp.replace(/\D/g, '');
  if (cleaned.length < 10) {
    return { ok: false, error: 'WhatsApp inválido' };
  }

  const whatsapp = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  const subtotal = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItems = input.items.reduce((sum, i) => sum + i.qty, 0);

  // Expira em 7 dias
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  try {
    // Upsert: atualiza se já existe, cria se não
    const existing = await prisma.cartRecovery.findFirst({
      where: {
        whatsapp,
        converted: false,
      },
      orderBy: { lastSeenAt: 'desc' },
    });

    if (existing) {
      const cart = await prisma.cartRecovery.update({
        where: { id: existing.id },
        data: {
          customerName: input.customerName || existing.customerName,
          items: input.items as any,
          subtotal,
          totalItems,
          cupom: input.cupom || existing.cupom,
          lastSeenAt: new Date(),
          expiresAt,
          // Reset flags de envio se foi atualizado (cliente voltou)
          sent1h: false,
          sent1hAt: null,
        },
      });
      return { ok: true, cartId: cart.id };
    }

    const cart = await prisma.cartRecovery.create({
      data: {
        whatsapp,
        customerName: input.customerName,
        items: input.items as any,
        subtotal,
        totalItems,
        cupom: input.cupom,
        expiresAt,
      },
    });

    return { ok: true, cartId: cart.id };
  } catch (e: any) {
    console.error('[cart-recovery] saveCart error:', e);
    return { ok: false, error: e.message };
  }
}

// ============== MARK AS CONVERTED ==============

/**
 * Marca carrinho como convertido (virou pedido)
 * Chamado quando order é criada com o WhatsApp do carrinho
 */
export async function markAsConverted(whatsapp: string, orderId: string): Promise<void> {
  const cleaned = whatsapp.replace(/\D/g, '');
  const phone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

  await prisma.cartRecovery.updateMany({
    where: {
      whatsapp: phone,
      converted: false,
    },
    data: {
      converted: true,
      orderId,
    },
  });

  console.log(`[cart-recovery] Carrinho de ${phone} → convertido (order ${orderId})`);
}

// ============== PROCESS ABANDONED ==============

const MSGS = {
  '1h': (c: any) => `🛒 *Oi! Sentimos sua falta*

Você deixou ${c.totalItems} ${c.totalItems === 1 ? 'item' : 'itens'} no carrinho da Becker:

${c.items.slice(0, 3).map((i: any) => `  • ${i.qty}x ${i.name} (${i.versionLabel})`).join('\n')}
${c.items.length > 3 ? `  ... e mais ${c.items.length - 3}\n` : ''}

💰 Total: *R$ ${Number(c.subtotal).toFixed(2).replace('.', ',')}*

⏰ Reservamos seus produtos por mais um tempo. Finalize agora:

🔗 ${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/carrinho

Qualquer dúvida, é só responder aqui! 😊`,

  '24h': (c: any) => `💚 *Becker - Seus produtos ainda estão esperando!*

Passou um dia e você ainda não finalizou. Seus itens no carrinho:

${c.items.slice(0, 3).map((i: any) => `  • ${i.qty}x ${i.name}`).join('\n')}

✨ *Que tal um incentivo?* Use o cupom *VOLTA10* e ganhe 10% OFF na sua compra!

Total com desconto: *R$ ${(Number(c.subtotal) * 0.9).toFixed(2).replace('.', ',')}*

🔗 Finalizar: ${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/carrinho
(Cupom aplica automaticamente no checkout)

Estamos aqui se precisar de ajuda! 🤗`,

  '72h': (c: any) => `👋 *Última chance!*

Oi! Seus produtos ainda estão no carrinho mas vamos liberar em breve.

${c.items.slice(0, 3).map((i: any) => `  • ${i.qty}x ${i.name}`).join('\n')}

🎁 *OFERTA ESPECIAL SÓ PRA VOCÊ:* Frete grátis + 15% OFF com o cupom *ULTIMACHANCE*

Total estimado: *R$ ${(Number(c.subtotal) * 0.85).toFixed(2).replace('.', ',')}*

🔗 ${process.env.SITE_DOMAIN || 'https://becker.pscode.ia.br'}/carrinho

Depois dessa, vamos devolver os produtos pro estoque! ⏰`,
};

/**
 * Processa carrinhos abandonados e envia mensagens conforme timing
 * 1h, 24h, 72h após último acesso
 */
export async function processAbandonedCarts(): Promise<{
  sent1h: number;
  sent24h: number;
  sent72h: number;
  cleaned: number;
  errors: number;
}> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneAndHalfHourAgo = new Date(now.getTime() - 90 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneAndHalfDayAgo = new Date(now.getTime() - 36 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
  const threeAndHalfDaysAgo = new Date(now.getTime() - 78 * 60 * 60 * 1000);

  const stats = { sent1h: 0, sent24h: 0, sent72h: 0, cleaned: 0, errors: 0 };

  // ============== 1 HORA ==============
  // Carrinhos atualizados entre 1h e 1h30 atrás, que ainda não receberam msg 1h
  const carts1h = await prisma.cartRecovery.findMany({
    where: {
      converted: false,
      sent1h: false,
      lastSeenAt: { gte: oneAndHalfHourAgo, lte: oneHourAgo },
    },
    take: 50, // limite por execução
  });

  for (const cart of carts1h) {
    try {
      const ok = await sendAbandonedMessage(cart, '1h');
      if (ok) {
        await prisma.cartRecovery.update({
          where: { id: cart.id },
          data: { sent1h: true, sent1hAt: new Date() },
        });
        stats.sent1h++;
      }
    } catch (e) {
      console.error(`[cart-recovery] Erro msg 1h ${cart.id}:`, e);
      stats.errors++;
    }
  }

  // ============== 24 HORAS ==============
  const carts24h = await prisma.cartRecovery.findMany({
    where: {
      converted: false,
      sent24h: false,
      sent1h: true, // só envia 24h se já enviou 1h
      lastSeenAt: { gte: oneAndHalfDayAgo, lte: oneDayAgo },
    },
    take: 50,
  });

  for (const cart of carts24h) {
    try {
      const ok = await sendAbandonedMessage(cart, '24h');
      if (ok) {
        await prisma.cartRecovery.update({
          where: { id: cart.id },
          data: { sent24h: true, sent24hAt: new Date() },
        });
        stats.sent24h++;
      }
    } catch (e) {
      console.error(`[cart-recovery] Erro msg 24h ${cart.id}:`, e);
      stats.errors++;
    }
  }

  // ============== 72 HORAS ==============
  const carts72h = await prisma.cartRecovery.findMany({
    where: {
      converted: false,
      sent72h: false,
      sent24h: true, // só envia 72h se já enviou 24h
      lastSeenAt: { gte: threeAndHalfDaysAgo, lte: threeDaysAgo },
    },
    take: 50,
  });

  for (const cart of carts72h) {
    try {
      const ok = await sendAbandonedMessage(cart, '72h');
      if (ok) {
        await prisma.cartRecovery.update({
          where: { id: cart.id },
          data: { sent72h: true, sent72hAt: new Date() },
        });
        stats.sent72h++;
      }
    } catch (e) {
      console.error(`[cart-recovery] Erro msg 72h ${cart.id}:`, e);
      stats.errors++;
    }
  }

  // ============== LIMPEZA ==============
  // Remove carrinhos expirados (>7 dias) que não converteram
  const expired = await prisma.cartRecovery.deleteMany({
    where: {
      expiresAt: { lt: now },
    },
  });
  stats.cleaned = expired.count;

  console.log(`[cart-recovery] Processado: 1h=${stats.sent1h}, 24h=${stats.sent24h}, 72h=${stats.sent72h}, cleaned=${stats.cleaned}, errors=${stats.errors}`);

  return stats;
}

async function sendAbandonedMessage(cart: any, type: '1h' | '24h' | '72h'): Promise<boolean> {
  const message = MSGS[type](cart);
  const result = await sendWhatsApp({
    number: cart.whatsapp,
    text: message,
  });
  return result.success;
}

// ============== LIST ==============

/**
 * Lista carrinhos abandonados (admin)
 */
export async function listAbandonedCarts(opts: { onlyAbandoned?: boolean; limit?: number } = {}) {
  return prisma.cartRecovery.findMany({
    where: {
      converted: opts.onlyAbandoned ? false : undefined,
    },
    orderBy: { lastSeenAt: 'desc' },
    take: opts.limit || 100,
  });
}
