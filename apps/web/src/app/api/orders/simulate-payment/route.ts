// ============================================================
// API: Simular pagamento aprovado (Sprint 3 / Mock)
// POST /api/orders/simulate-payment
// Sprint 6: substituir por webhook Mercado Pago
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { notifyOrder } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const { orderId, method } = await req.json();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId obrigatório' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });
    }

    if (order.status === 'PAID' || order.status === 'PROCESSING') {
      return NextResponse.json({ ok: true, message: 'Já estava pago' });
    }

    // Atualiza status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        paidAt: new Date(),
        paymentMethod: method || order.paymentMethod,
      },
    });

    // Envia WhatsApp notificando pagamento aprovado
    try {
      await notifyOrder({ orderId, event: 'payment_approved' });
    } catch (e) {
      console.error('Erro ao notificar pagamento:', e);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Simulate payment error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
