// ============================================================
// Webhook Mercado Pago
// Recebe notificações de mudança de status de pagamento.
// O corpo da notificação NÃO é confiável: só serve para achar o id do
// pagamento, que é consultado na API do MP. O pedido é localizado pelo
// external_reference do pagamento consultado.
// Docs: https://www.mercadopago.com.br/developers/pt/reference/notifications/webhooks
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@becker/db';
import { mercadopagoLib } from '@/lib/payments';
import { notifyOrder } from '@/lib/notify';

const AMOUNT_TOLERANCE = 0.01;

/**
 * Valida o x-signature do MP (manifest "id:<data.id>;request-id:<x-request-id>;ts:<ts>;").
 * Sem MERCADOPAGO_WEBHOOK_SECRET apenas avisa; com o segredo, falha fechada.
 */
function verifySignature(req: NextRequest, dataId: string | null): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.warn('[mercadopago webhook] MERCADOPAGO_WEBHOOK_SECRET ausente: assinatura não validada');
    return true;
  }
  const header = req.headers.get('x-signature');
  const requestId = req.headers.get('x-request-id') || '';
  if (!header || !dataId) return false;

  const parts = Object.fromEntries(
    header.split(',').map((p) => {
      const [k, ...v] = p.trim().split('=');
      return [k, v.join('=')];
    }),
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(v1, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json().catch(() => ({}));
    const b = (typeof body === 'object' && body !== null ? body : {}) as {
      type?: string;
      topic?: string;
      resource?: string;
      id?: string | number;
      status?: string;
      data?: { id?: string | number };
    };

    // MP envia 2 tipos de notificação:
    // 1. { type: "payment", data: { id: "123" } }
    // 2. { resource: "https://...", topic: "payment" }
    let paymentId: string | null = null;

    if (b.type === 'payment' && b.data?.id) {
      paymentId = String(b.data.id);
    } else if (b.topic === 'payment' && typeof b.resource === 'string') {
      const match = b.resource.match(/\/v\d+\/payments\/(\d+)/);
      if (match) paymentId = match[1];
    } else if (b.id && b.status) {
      paymentId = String(b.id);
    }

    if (!paymentId || !/^\d+$/.test(paymentId)) {
      return NextResponse.json({ ok: true, message: 'No payment ID found' });
    }

    const dataId = req.nextUrl.searchParams.get('data.id') || (b.data?.id ? String(b.data.id) : paymentId);
    if (!verifySignature(req, dataId)) {
      console.warn('[mercadopago webhook] Assinatura inválida');
      return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
    }

    // Fonte da verdade: consulta o pagamento na API do MP
    const paymentStatus = await mercadopagoLib.getPaymentStatus(paymentId);
    if (!paymentStatus) {
      console.error('[mercadopago webhook] Erro ao buscar pagamento', paymentId);
      return NextResponse.json({ ok: false, error: 'Payment not found' }, { status: 404 });
    }

    console.log(`[mercadopago webhook] Payment ${paymentId} status: ${paymentStatus.status}`);

    const ref = paymentStatus.externalReference;
    const order = ref ? await prisma.order.findUnique({ where: { id: ref } }) : null;
    if (!order) {
      console.warn(`[mercadopago webhook] Pedido não encontrado para o pagamento ${paymentId}`);
      return NextResponse.json({ ok: true, message: 'Order not found' });
    }

    const newStatus = mercadopagoLib.mapMPStatusToOrderStatus(paymentStatus.status);

    if (newStatus === 'PAID') {
      if (Math.abs(paymentStatus.amount - Number(order.total)) > AMOUNT_TOLERANCE) {
        console.error(`[mercadopago webhook] Valor divergente no pedido ${order.number}: não marcado como pago`);
        return NextResponse.json({ ok: true, message: 'Amount mismatch' });
      }
      // Atualização condicional: só a primeira notificação aprovada vence (idempotência)
      const claimed = await prisma.order.updateMany({
        where: { id: order.id, paymentStatus: { not: 'PAID' } },
        data: { status: 'PAID', paymentStatus: 'PAID', paymentId, paidAt: new Date() },
      });
      if (claimed.count === 1) {
        console.log(`[mercadopago webhook] Pedido ${order.number} → PAID`);
        try {
          await notifyOrder({ orderId: order.id, event: 'payment_approved' });
        } catch (e) {
          console.error('[mercadopago webhook] Erro WhatsApp cliente:', e);
        }
      }
    } else if (newStatus === 'FAILED' && order.paymentStatus === 'PENDING') {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'FAILED', paymentId },
      });
      console.log(`[mercadopago webhook] Pedido ${order.number} → FAILED`);
    } else if (newStatus === 'REFUNDED' && order.paymentStatus !== 'REFUNDED' && order.paymentId === paymentId) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'REFUNDED', paymentStatus: 'REFUNDED' },
      });
      console.log(`[mercadopago webhook] Pedido ${order.number} → REFUNDED`);
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('[mercadopago webhook] Erro:', e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

// MP também pode enviar GET para validar o endpoint
export async function GET() {
  return NextResponse.json({ ok: true, message: 'Mercado Pago webhook endpoint' });
}
