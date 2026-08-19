// ============================================================
// Delivery system - Sprint 12
// Lógica central de criação/transição de Delivery
// + envio de WhatsApp template por evento
// ============================================================

import { prisma } from '@becker/db';
import { sendWhatsApp } from './whatsapp-client';
import { whatsappTemplates } from './whatsapp-templates';
import { notifyAdminDelivery } from './notify';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://becker.pscode.ia.br';

export interface CreateDeliveryOptions {
  orderId: string;
  motoboyName?: string;
  motoboyPhone?: string;
  actor?: 'admin' | 'system';
}

export interface CreateDeliveryResult {
  ok: boolean;
  deliveryId?: string;
  error?: string;
}

/** Cria uma delivery + marca como OUT_FOR_DELIVERY + envia WhatsApp */
export async function createOutForDelivery(
  opts: CreateDeliveryOptions
): Promise<CreateDeliveryResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: opts.orderId },
      include: {
        address: true,
        user: true,
        items: true,
      },
    });

    if (!order) {
      return { ok: false, error: 'Pedido não encontrado' };
    }

    // Idempotente: se já existe delivery, retorna
    let delivery = await prisma.delivery.findUnique({
      where: { orderId: order.id },
    });

    if (delivery) {
      // Atualiza motoboy se mudou
      delivery = await prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          motoboyName: opts.motoboyName || delivery.motoboyName,
          motoboyPhone: opts.motoboyPhone || delivery.motoboyPhone,
        },
      });
      return { ok: true, deliveryId: delivery.id };
    }

    // Cria
    delivery = await prisma.delivery.create({
      data: {
        orderId: order.id,
        status: 'OUT_FOR_DELIVERY',
        motoboyName: opts.motoboyName,
        motoboyPhone: opts.motoboyPhone,
        outForDeliveryAt: new Date(),
        events: {
          create: {
            type: 'out_for_delivery',
            actor: opts.actor || 'admin',
            message: opts.motoboyName
              ? `Motoboy ${opts.motoboyName} saiu pra entrega`
              : 'Pedido saiu pra entrega',
          },
        },
      },
    });

    // Envia WhatsApp pro cliente
    if (order.address && order.guestWhatsapp) {
      const customerName = order.user?.name || 'Cliente';
      const confirmUrl = `${BASE_URL}/api/delivery/confirm?token=${delivery.confirmToken}&action=confirm`;
      const problemUrl = `${BASE_URL}/api/delivery/confirm?token=${delivery.confirmToken}&action=problem`;

      const message = whatsappTemplates.deliveryOutForDelivery({
        customerName,
        orderNumber: order.number,
        motoboyName: opts.motoboyName,
        address: {
          street: order.address.street,
          number: order.address.number,
          neighborhood: order.address.district,
          city: order.address.city,
          state: order.address.state,
        },
        confirmUrl,
        problemUrl,
      });

      try {
        await sendWhatsApp({
          phone: order.guestWhatsapp,
          message,
        });
      } catch (e) {
        console.error('[delivery] WhatsApp send error:', e);
      }
    }

    // Notifica admin
    try {
      await notifyAdminDelivery({
        orderNumber: order.number,
        event: 'out_for_delivery',
        motoboyName: opts.motoboyName,
      });
    } catch (e) {
      console.error('[delivery] Admin notify error:', e);
    }

    return { ok: true, deliveryId: delivery.id };
  } catch (e: any) {
    console.error('[delivery] createOutForDelivery error:', e);
    return { ok: false, error: e.message || String(e) };
  }
}

export interface ConfirmDeliveryOptions {
  token: string;
  action: 'confirm' | 'problem';
  problemNote?: string;
}

export interface ConfirmDeliveryResult {
  ok: boolean;
  status?: 'DELIVERED' | 'DELIVERED_WITH_ISSUE' | 'FAILED';
  error?: string;
  message?: string;
}

/** Cliente confirma via token (público, sem auth) */
export async function confirmDelivery(
  opts: ConfirmDeliveryOptions
): Promise<ConfirmDeliveryResult> {
  try {
    const delivery = await prisma.delivery.findUnique({
      where: { confirmToken: opts.token },
      include: {
        order: { include: { user: true, address: true } },
      },
    });

    if (!delivery) {
      return { ok: false, error: 'Token inválido' };
    }

    if (delivery.status === 'DELIVERED' || delivery.status === 'DELIVERED_WITH_ISSUE') {
      return {
        ok: true,
        status: delivery.status,
        message: 'Entrega já confirmada anteriormente',
      };
    }

    if (opts.action === 'confirm') {
      // Marca como DELIVERED
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          events: {
            create: {
              type: 'confirmed_ok',
              actor: 'customer',
              message: 'Cliente confirmou recebimento',
            },
          },
        },
      });

      // Atualiza o pedido
      await prisma.order.update({
        where: { id: delivery.orderId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
        },
      });

      // WhatsApp de agradecimento
      const customerName = delivery.order.user?.name || 'Cliente';
      const thanksMsg = whatsappTemplates.deliveryConfirmedThanks({
        customerName,
        orderNumber: delivery.order.number,
      });

      if (delivery.order.guestWhatsapp) {
        try {
          await sendWhatsApp({ phone: delivery.order.guestWhatsapp, message: thanksMsg });
        } catch (e) {
          console.error('[delivery] Thanks WhatsApp error:', e);
        }
      }

      return { ok: true, status: 'DELIVERED', message: 'Recebimento confirmado!' };
    } else if (opts.action === 'problem') {
      // Marca como DELIVERED_WITH_ISSUE
      await prisma.delivery.update({
        where: { id: delivery.id },
        data: {
          status: 'DELIVERED_WITH_ISSUE',
          problemAt: new Date(),
          problemNote: opts.problemNote || null,
          events: {
            create: {
              type: 'problem',
              actor: 'customer',
              message: opts.problemNote || 'Cliente reportou problema',
            },
          },
        },
      });

      // Não muda o status do pedido — admin vai avaliar

      // WhatsApp de problema recebido
      const customerName = delivery.order.user?.name || 'Cliente';
      const problemMsg = whatsappTemplates.deliveryProblemReceived({
        customerName,
        orderNumber: delivery.order.number,
      });

      if (delivery.order.guestWhatsapp) {
        try {
          await sendWhatsApp({ phone: delivery.order.guestWhatsapp, message: problemMsg });
        } catch (e) {
          console.error('[delivery] Problem WhatsApp error:', e);
        }
      }

      // Notifica admin
      try {
        await notifyAdminDelivery({
          orderNumber: delivery.order.number,
          event: 'problem',
          problemNote: opts.problemNote,
        });
      } catch (e) {
        console.error('[delivery] Admin notify error:', e);
      }

      return {
        ok: true,
        status: 'DELIVERED_WITH_ISSUE',
        message: 'Problema registrado. Nossa equipe vai te chamar em instantes.',
      };
    }

    return { ok: false, error: 'Ação inválida' };
  } catch (e: any) {
    console.error('[delivery] confirmDelivery error:', e);
    return { ok: false, error: e.message || String(e) };
  }
}

export interface ReminderResult {
  ok: boolean;
  sent: number;
  errors: string[];
}

/** Envia lembrete 24h pra deliveries OUT_FOR_DELIVERY que não foram confirmadas */
export async function sendDeliveryReminders(): Promise<ReminderResult> {
  const result: ReminderResult = { ok: true, sent: 0, errors: [] };

  try {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const deliveries = await prisma.delivery.findMany({
      where: {
        status: 'OUT_FOR_DELIVERY',
        outForDeliveryAt: { lte: cutoff },
        // Não reenviar se já mandou lembrete há < 12h
        OR: [
          { lastReminderAt: null },
          { lastReminderAt: { lte: new Date(Date.now() - 12 * 60 * 60 * 1000) } },
        ],
      },
      include: {
        order: { include: { user: true } },
      },
      take: 50, // limite por execução
    });

    for (const delivery of deliveries) {
      try {
        const customerName = delivery.order.user?.name || 'Cliente';
        const confirmUrl = `${BASE_URL}/api/delivery/confirm?token=${delivery.confirmToken}&action=confirm`;
        const problemUrl = `${BASE_URL}/api/delivery/confirm?token=${delivery.confirmToken}&action=problem`;

        const message = whatsappTemplates.deliveryReminder24h({
          customerName,
          orderNumber: delivery.order.number,
          confirmUrl,
          problemUrl,
        });

        if (delivery.order.guestWhatsapp) {
          await sendWhatsApp({ phone: delivery.order.guestWhatsapp, message });
        }

        await prisma.delivery.update({
          where: { id: delivery.id },
          data: {
            lastReminderAt: new Date(),
            events: {
              create: {
                type: 'reminder',
                actor: 'cron',
                message: 'Lembrete 24h enviado',
              },
            },
          },
        });

        result.sent++;
      } catch (e: any) {
        result.errors.push(`Delivery ${delivery.id}: ${e.message || String(e)}`);
      }
    }
  } catch (e: any) {
    console.error('[delivery] sendDeliveryReminders error:', e);
    result.ok = false;
    result.errors.push(e.message || String(e));
  }

  return result;
}
