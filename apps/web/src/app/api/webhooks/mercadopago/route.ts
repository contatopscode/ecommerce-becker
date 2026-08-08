// ============================================================
// Webhook Mercado Pago
// Recebe notificações de mudança de status de pagamento
// Docs: https://www.mercadopago.com.br/developers/pt/reference/notifications/webhooks
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { mercadopagoLib } from '@/lib/payments';
import { notifyOrder } from '@/lib/notify';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('[mercadopago webhook] Recebido:', JSON.stringify(body).slice(0, 500));

    // MP envia 2 tipos de notificação:
    // 1. { type: "payment", data: { id: "123" } }
    // 2. { resource: "https://...", topic: "payment" }

    let paymentId: string | null = null;

    if (body.type === 'payment' && body.data?.id) {
      paymentId = String(body.data.id);
    } else if (body.topic === 'payment' && body.resource) {
      // Extrai ID da URL
      const match = body.resource.match(/\/v\d+\/payments\/(\d+)/);
      if (match) paymentId = match[1];
    } else if (body.id && body.status) {
      // IPN antigo
      paymentId = String(body.id);
    }

    if (!paymentId) {
      console.warn('[mercadopago webhook] Não foi possível extrair paymentId');
      return NextResponse.json({ ok: true, message: 'No payment ID found' });
    }

    // Busca status do pagamento no MP
    const paymentStatus = await mercadopagoLib.getPaymentStatus(paymentId);
    if (!paymentStatus) {
      console.error('[mercadopago webhook] Erro ao buscar pagamento', paymentId);
      return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 });
    }

    console.log(`[mercadopago webhook] Payment ${paymentId} status: ${paymentStatus.status}`);

    // Encontra o pedido pelo paymentId
    const order = await prisma.order.findFirst({
      where: { paymentId: String(paymentId) },
    });

    if (!order) {
      console.warn(`[mercadopago webhook] Pedido não encontrado para paymentId ${paymentId}`);
      return NextResponse.json({ ok: true, message: 'Order not found' });
    }

    // Atualiza status
    const newStatus = mercadopagoLib.mapMPStatusToOrderStatus(paymentStatus.status);

    if (newStatus === 'PAID' && order.status !== 'PAID') {
      // Pagamento aprovado!
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });

      console.log(`[mercadopago webhook] Pedido ${order.number} → PAID`);

      // Envia WhatsApp cliente
      try {
        await notifyOrder({ orderId: order.id, event: 'payment_approved' });
      } catch (e) {
        console.error('[mercadopago webhook] Erro WhatsApp cliente:', e);
      }
    } else if (newStatus === 'FAILED' && order.paymentStatus !== 'FAILED') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED' },
      });
      console.log(`[mercadopago webhook] Pedido ${order.number} → FAILED`);
    } else if (newStatus === 'REFUNDED' && order.paymentStatus !== 'REFUNDED') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
        },
      });
      console.log(`[mercadopago webhook] Pedido ${order.number} → REFUNDED`);
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[mercadopago webhook] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// MP também pode enviar GET para validar o endpoint
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Mercado Pago webhook endpoint' });
}
