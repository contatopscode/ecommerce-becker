// ============================================================
// API Admin: Mudar status do pedido
// POST /api/admin/pedidos/status
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { sendWhatsApp } from '@/lib/whatsapp-client';
import { notifyOrder } from '@/lib/notify';
import { createOutForDelivery } from '@/lib/delivery';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 403 });
    }

    const { orderId, status, tracking, motoboyName, motoboyPhone } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ ok: false, error: 'orderId e status obrigatórios' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });

    // Atualizar
    const updateData: any = { status };
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
      if (tracking) updateData.tracking = tracking;
    }
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();
    if (status === 'PAID') {
      updateData.paymentStatus = 'PAID';
      updateData.paidAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Notifica cliente via WhatsApp (Sprint 2: templates padronizados)
    const eventMap: Record<string, 'payment_approved' | 'preparing' | 'shipped' | 'delivered' | 'cancelled'> = {
      PAID: 'payment_approved',
      PROCESSING: 'preparing',
      SHIPPED: 'shipped',
      DELIVERED: 'delivered',
      CANCELLED: 'cancelled',
    };
    const event = eventMap[status];
    if (event) {
      try {
        await notifyOrder({
          orderId: order.id,
          event,
          trackingCode: tracking || undefined,
        });
      } catch (e) {
        console.error('Erro ao notificar cliente:', e);
      }
    }

    // SPRINT 12: Quando vira SHIPPED, cria Delivery + envia WhatsApp "saiu pra entrega"
    if (status === 'SHIPPED') {
      try {
        await createOutForDelivery({
          orderId: order.id,
          motoboyName,
          motoboyPhone,
          actor: 'admin',
        });
      } catch (e) {
        console.error('[pedidos/status] createOutForDelivery error:', e);
      }
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
