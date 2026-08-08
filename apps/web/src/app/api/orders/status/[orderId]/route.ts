// ============================================================
// API: Consultar status de pedido + pagamento
// GET /api/orders/status/[orderId]
// Usado pra polling na página de pagamento
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { mercadopagoLib } from '@/lib/payments';

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        number: true,
        status: true,
        paymentStatus: true,
        paymentId: true,
        paymentMethod: true,
        paidAt: true,
        total: true,
      },
    });

    if (!order) {
      return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });
    }

    // Se tem paymentId e ainda está PENDING, consulta MP pra atualizar
    if (order.paymentId && order.status === 'PENDING' && order.paymentStatus === 'PENDING') {
      const mpStatus = await mercadopagoLib.getPaymentStatus(order.paymentId);
      if (mpStatus && mpStatus.status === 'approved') {
        const newStatus = mercadopagoLib.mapMPStatusToOrderStatus(mpStatus.status);
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: newStatus,
            paymentStatus: newStatus,
            paidAt: new Date(),
          },
        });
        return NextResponse.json({
          ok: true,
          order: {
            ...order,
            status: newStatus,
            paymentStatus: newStatus,
            paidAt: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json({ ok: true, order });
  } catch (e: any) {
    console.error('[order status] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
