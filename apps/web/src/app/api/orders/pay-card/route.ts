// ============================================================
// API: (Re)gerar link de pagamento com cartão (Checkout Pro)
// POST /api/orders/pay-card  { orderId }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { createCardPaymentForOrder } from '@/lib/payments/order-preference';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, LIMITS.CREATE_ORDER);
  if (limited) return limited;

  try {
    const { orderId } = await req.json();
    if (typeof orderId !== 'string' || !orderId) {
      return NextResponse.json({ ok: false, error: 'Pedido inválido' }, { status: 400 });
    }
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== 'credit_card') {
      return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });
    }
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED') {
      return NextResponse.json({ ok: false, error: 'Este pedido não está aguardando pagamento' }, { status: 409 });
    }
    const payment = await createCardPaymentForOrder(order.id);
    return NextResponse.json({ ok: true, payment });
  } catch (e) {
    console.error('[pay-card] erro:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: 'Erro ao gerar o pagamento' }, { status: 500 });
  }
}
