// ============================================================
// Notification service — centraliza envio de WhatsApp
// Sprint 2: todas as notificações de pedido passam por aqui
// ============================================================

import { prisma } from '@becker/db';
import { sendWhatsApp } from '@/lib/whatsapp-client';
import { whatsappTemplates } from '@/lib/whatsapp-templates';
import { sendTelegram, telegramTemplates } from '@/lib/telegram';

export type NotificationEvent =
  | 'order_created'
  | 'payment_approved'
  | 'preparing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface NotifyOrderInput {
  orderId: string;
  event: NotificationEvent;
  trackingCode?: string;
  customMessage?: string;
}

/**
 * Envia notificação WhatsApp baseada no evento do pedido
 * - Busca pedido + endereço + itens
 * - Aplica template apropriado
 * - Envia via Evolution API
 * - Falha silenciosa (best-effort)
 */
export async function notifyOrder(input: NotifyOrderInput) {
  const { orderId, event, trackingCode, customMessage } = input;

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: true,
        address: true,
      },
    });

    if (!order) {
      console.error(`[notify] Pedido ${orderId} não encontrado`);
      return { ok: false, error: 'Pedido não encontrado' };
    }

    const phone = order.user?.whatsapp || order.guestWhatsapp;
    if (!phone) {
      console.log(`[notify] Pedido ${order.number} sem WhatsApp — pulando`);
      return { ok: false, error: 'Sem WhatsApp' };
    }

    const phoneDigits = phone.replace(/\D/g, '');

    const orderData = {
      number: order.number,
      customerName: order.user?.name || order.guestName || 'Cliente',
      items: order.items.map((i) => ({
        productName: i.productName,
        versionLabel: i.versionLabel,
        qty: i.qty,
        price: Number(i.price),
        total: Number(i.total),
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shipping: Number(order.shipping),
      total: Number(order.total),
      paymentMethod: (order.paymentMethod as 'pix' | 'credit_card') || 'pix',
      tracking: trackingCode || order.tracking,
      trackingUrl: `https://becker.pscode.ia.br/pedido/${order.number}`,
      address: order.address
        ? {
            street: order.address.street,
            number: order.address.number,
            neighborhood: order.address.district,
            city: order.address.city,
            state: order.address.state,
          }
        : undefined,
    };

    let text: string;
    if (customMessage) {
      text = customMessage;
    } else {
      switch (event) {
        case 'order_created':
          text = whatsappTemplates.orderCreated(orderData);
          break;
        case 'payment_approved':
          text = whatsappTemplates.paymentApproved(orderData);
          break;
        case 'preparing':
          text = whatsappTemplates.preparing(orderData);
          break;
        case 'shipped':
          text = whatsappTemplates.shipped(orderData);
          break;
        case 'delivered':
          text = whatsappTemplates.delivered(orderData);
          break;
        case 'cancelled':
          text = whatsappTemplates.cancelled(orderData);
          break;
        default:
          text = customMessage || `Status do pedido ${order.number} atualizado.`;
      }
    }

    await sendWhatsApp({ number: phoneDigits, text });

    // Envia também pro Telegram (Sprint 8 - notificação interna)
    try {
      const telegramMap: Record<string, (o: any) => string> = {
        order_created: (o) => telegramTemplates.newOrder({
          number: o.number,
          customerName: o.customerName,
          total: o.total,
          itemCount: o.items.length,
          items: o.items.map((i) => `  • ${i.qty}x ${i.productName}`).join('\n'),
        }),
        payment_approved: (o) => telegramTemplates.paymentApproved({
          number: o.number, customerName: o.customerName, total: o.total,
        }),
        shipped: (o) => telegramTemplates.orderShipped({
          number: o.number, customerName: o.customerName, tracking: orderData.tracking || 'N/A',
        }),
        delivered: (o) => telegramTemplates.orderDelivered({
          number: o.number, customerName: o.customerName,
        }),
        cancelled: (o) => telegramTemplates.orderCancelled({
          number: o.number, customerName: o.customerName,
        }),
      };
      const telegramMsg = telegramMap[event]?.(orderData);
      if (telegramMsg) {
        await sendTelegram(telegramMsg);
      }
    } catch (e) {
      console.error('[notify] Telegram error:', e);
    }

    console.log(`[notify] ✓ ${event} enviado para ${phoneDigits} (pedido ${order.number})`);
    return { ok: true };
  } catch (e: any) {
    console.error(`[notify] Erro:`, e);
    return { ok: false, error: e.message };
  }
}
