// ============================================================
// API: (Re)gerar link de pagamento com cartão (Checkout Pro)
// POST /api/orders/pay-card  { orderId }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { createCardPaymentForOrder, type OrderCardPayment } from '@/lib/payments/order-preference';

const IP_LIMIT = { max: 20, windowMs: 60 * 60 * 1000 };
const ORDER_LIMIT = { max: 5, windowMs: 60 * 60 * 1000 };
const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { payment: OrderCardPayment; at: number }>();

function tooMany() {
  return NextResponse.json({ ok: false, error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`pay-card:ip:${getClientIp(req)}`, IP_LIMIT).ok) return tooMany();

  try {
    const { orderId } = await req.json();
    if (typeof orderId !== 'string' || !orderId) {
      return NextResponse.json({ ok: false, error: 'Pedido inválido' }, { status: 400 });
    }
    if (!rateLimit(`pay-card:order:${orderId}`, ORDER_LIMIT).ok) return tooMany();
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.paymentMethod !== 'credit_card') {
      return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });
    }
    if (order.paymentStatus === 'PAID' || order.paymentStatus === 'REFUNDED' || order.status === 'CANCELLED') {
      return NextResponse.json({ ok: false, error: 'Este pedido não está aguardando pagamento' }, { status: 409 });
    }
    const now = Date.now();
    for (const [k, v] of cache) if (now - v.at > CACHE_MS) cache.delete(k);
    const cached = cache.get(order.id);
    if (cached) return NextResponse.json({ ok: true, payment: cached.payment });

    const payment = await createCardPaymentForOrder(order.id);
    if (payment.initPoint) cache.set(order.id, { payment, at: now });
    return NextResponse.json({ ok: true, payment });
  } catch (e) {
    console.error('[pay-card] erro:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: 'Erro ao gerar o pagamento' }, { status: 500 });
  }
}
