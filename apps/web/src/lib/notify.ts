// ============================================================
// Notification service — centraliza envio de notificações
// Sprint 2: notificações de pedido para o CLIENTE (WhatsApp)
// Sprint 8+: notificações INTERNAS para a EQUIPE (WhatsApp Admin)
// Substitui Telegram (não acessível)
// ============================================================

import { prisma } from '@becker/db';
import { sendWhatsApp, normalizeWhatsAppNumber } from '@/lib/whatsapp-client';
import { whatsappTemplates } from '@/lib/whatsapp-templates';
import { notifyAdmin, adminTemplates } from '@/lib/whatsapp-admin';

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
 * Envia notificações:
 * - Cliente: WhatsApp via Evolution (template formatado)
 * - Admin: WhatsApp via Evolution (resumo interno)
 *
 * Best-effort: falhas não derrubam o fluxo principal
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
      console.log(`[notify] Pedido ${order.number} sem WhatsApp — pulando envio cliente`);
    }

    const orderData = {
      number: order.number,
      customerName: order.user?.name || order.guestName || 'Cliente',
      customerPhone: phone || '',
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

    // ========== CLIENTE: WhatsApp Evolution ==========
    if (phone) {
      const phoneDigits = normalizeWhatsAppNumber(phone);

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

      try {
        await sendWhatsApp({ number: phoneDigits, text });
        console.log(`[notify] ✓ Cliente notificado: ${event} → ${phoneDigits}`);
      } catch (e: any) {
        console.error(`[notify] ❌ Cliente WhatsApp falhou:`, e.message);
      }
    }

    // ========== ADMIN: WhatsApp Evolution (resumo interno) ==========
    try {
      let adminMsg: string | undefined;
      switch (event) {
        case 'order_created':
          adminMsg = adminTemplates.newOrder({
            number: orderData.number,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            total: orderData.total,
            items: orderData.items.map((i) => ({
              qty: i.qty,
              productName: i.productName,
              versionLabel: i.versionLabel,
            })),
            address: orderData.address,
            paymentMethod: orderData.paymentMethod,
          });
          break;
        case 'payment_approved':
          adminMsg = adminTemplates.paymentApproved({
            number: orderData.number,
            customerName: orderData.customerName,
            total: orderData.total,
          });
          break;
        case 'shipped':
          adminMsg = adminTemplates.orderShipped({
            number: orderData.number,
            customerName: orderData.customerName,
            tracking: orderData.tracking || 'N/A',
          });
          break;
        case 'delivered':
          adminMsg = adminTemplates.orderDelivered({
            number: orderData.number,
            customerName: orderData.customerName,
          });
          break;
        case 'cancelled':
          adminMsg = adminTemplates.orderCancelled({
            number: orderData.number,
            customerName: orderData.customerName,
          });
          break;
        default:
          // preparing não tem admin template, usa custom
          adminMsg = `📦 Pedido *${orderData.number}* — ${orderData.customerName} em separação`;
      }

      if (adminMsg) {
        const result = await notifyAdmin(adminMsg);
        if (result.ok) {
          console.log(`[notify] ✓ Admin notificado: ${event}`);
        } else {
          console.error(`[notify] ❌ Admin falhou: ${result.error}`);
        }
      }
    } catch (e: any) {
      console.error('[notify] Admin notify error:', e.message);
    }

    return { ok: true };
  } catch (e: any) {
    console.error(`[notify] Erro geral:`, e);
    return { ok: false, error: e.message };
  }
}

/**
 * Notifica admin sobre lead capturado (WhatsApp digitado mas pedido não finalizado)
 */
export async function notifyNewLead(lead: { name: string; whatsapp: string; source?: string }) {
  try {
    const msg = adminTemplates.newLead({
      name: lead.name,
      whatsapp: lead.whatsapp,
      source: lead.source || 'Site - Checkout',
    });
    return await notifyAdmin(msg);
  } catch (e: any) {
    console.error('[notify] Lead error:', e.message);
    return { ok: false, error: e.message };
  }
}

// ============ DELIVERY (Sprint 12) ============

/**
 * Notifica admin sobre evento de entrega
 */
export async function notifyAdminDelivery(input: {
  orderNumber: string;
  event: 'out_for_delivery' | 'problem';
  motoboyName?: string;
  problemNote?: string;
}) {
  try {
    let msg = '';
    if (input.event === 'out_for_delivery') {
      msg = `🚚 *Pedido ${input.orderNumber} saiu pra entrega!*\n${
        input.motoboyName ? `Motoboy: ${input.motoboyName}` : ''
      }`.trim();
    } else if (input.event === 'problem') {
      msg = `⚠️ *Problema na entrega do pedido ${input.orderNumber}!*\n${
        input.problemNote ? `Cliente disse: "${input.problemNote}"` : 'Cliente reportou problema'
      }\n\nEntre em contato com o cliente URGENTE!`;
    }
    if (msg) {
      return await notifyAdmin(msg);
    }
    return { ok: false, error: 'evento sem mensagem' };
  } catch (e: any) {
    console.error('[notify] Delivery error:', e.message);
    return { ok: false, error: e.message };
  }
}
