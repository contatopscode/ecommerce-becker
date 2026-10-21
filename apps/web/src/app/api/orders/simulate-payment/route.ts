// ============================================================
// API: Simular pagamento aprovado (somente desenvolvimento)
// POST /api/orders/simulate-payment
// Só existe com MERCADOPAGO_SANDBOX=true e para ADMIN/SUPER_ADMIN.
// Em qualquer outro caso responde 404, como se a rota não existisse.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { notifyOrder } from '@/lib/notify';
import { getSession } from '@/lib/auth/session';

const notFound = () => NextResponse.json({ ok: false, error: 'Não encontrado' }, { status: 404 });

export async function POST(req: NextRequest) {
  if (process.env.MERCADOPAGO_SANDBOX !== 'true') return notFound();

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
    }
    if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 });
    }

    const { orderId } = await req.json();
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ ok: false, error: 'orderId obrigatório' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Marcação condicional: só quem ainda não está pago muda, e só ele notifica.
    const { count } = await prisma.order.updateMany({
      where: { id: orderId, paymentStatus: { not: 'PAID' } },
      data: {
        status: 'PAID',
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });
    if (count === 0) {
      return NextResponse.json({ ok: true, message: 'Já estava pago' });
    }

    try {
      await notifyOrder({ orderId, event: 'payment_approved' });
    } catch (e) {
      console.error('Erro ao notificar pagamento:', e);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('Simulate payment error:', e);
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 500 });
  }
}
