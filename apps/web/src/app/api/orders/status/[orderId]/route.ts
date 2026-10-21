// ============================================================
// API: Consultar status de pedido + pagamento
// GET /api/orders/status/[orderId]?t=<token>
// Usado pra polling na página de pagamento. Exige ?t= válido deste pedido ou sessão dona/admin.
// Resposta mínima: status e paymentStatus.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { mercadopagoLib } from '@/lib/payments';
import { canAccessOrderId } from '@/lib/auth/pedido-guard';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

// Polling a cada 5 s = 12/min por aba aberta
const IP_LIMIT = { max: 120, windowMs: 60 * 1000 };
const ORDER_LIMIT = { max: 60, windowMs: 60 * 1000 };

const NOT_FOUND = () => NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  if (!rateLimit(`order-status:ip:${getClientIp(req)}`, IP_LIMIT).ok) {
    return NextResponse.json({ ok: false, error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
  }
  try {
    const { orderId } = await params;
    if (!rateLimit(`order-status:order:${orderId}`, ORDER_LIMIT).ok) {
      return NextResponse.json({ ok: false, error: 'Muitas requisições. Tente novamente mais tarde.' }, { status: 429 });
    }
    if (!(await canAccessOrderId(orderId, req.nextUrl.searchParams.get('t')))) return NOT_FOUND();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, paymentStatus: true, paymentId: true },
    });
    if (!order) return NOT_FOUND();

    let { status, paymentStatus } = order;

    // Se tem paymentId e ainda está PENDING, consulta MP pra atualizar
    if (order.paymentId && status === 'PENDING' && paymentStatus === 'PENDING') {
      const mpStatus = await mercadopagoLib.getPaymentStatus(order.paymentId);
      if (mpStatus && mpStatus.status === 'approved') {
        // 'approved' mapeia sempre para PAID, válido em OrderStatus e PaymentStatus
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID', paymentStatus: 'PAID', paidAt: new Date() },
        });
        status = 'PAID';
        paymentStatus = 'PAID';
      }
    }

    return NextResponse.json({ ok: true, status, paymentStatus, paid: status === 'PAID' });
  } catch (e: unknown) {
    console.error('[order status] erro:', e instanceof Error ? e.message : 'desconhecido');
    return NextResponse.json({ ok: false, error: 'Erro ao consultar o pedido' }, { status: 500 });
  }
}
