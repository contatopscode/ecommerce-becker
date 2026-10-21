// ============================================================
// Checkout > Pagamento
// Sprint 6: integração Mercado Pago (PIX + Cartão)
// ============================================================

import { prisma } from '@becker/db';
import { notFound } from 'next/navigation';
import { PaymentClient } from './PaymentClient';
import { PageShell } from '@/components/PageShell';
import { orderIdFromToken } from '@/lib/auth/pedido-link';
import { canAccessOrderId } from '@/lib/auth/pedido-guard';

export const dynamic = 'force-dynamic';

export default async function CheckoutPaymentPage({ searchParams }: { searchParams: Promise<{ orderId?: string; erro?: string; t?: string }> }) {
  const { orderId, erro, t } = await searchParams;

  // Mesma regra de /pedido/[id]: sessão dona/admin ou ?t= válido para este pedido. O id sozinho não basta,
  // e esta página nunca emite token. Inexistente e não autorizado dão a mesma resposta (404).
  if (!orderId || !(await canAccessOrderId(orderId, t))) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true },
  });
  if (!order) notFound();

  // Token só é repassado se veio na URL e é deste pedido; dono por sessão navega sem token
  const viewToken = orderIdFromToken(t) === order.id ? (t ?? null) : null;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-eco-100 mb-3">
            <span className="text-3xl">🎉</span>
          </div>
          <h1 className="text-2xl font-extrabold">Pedido {order.number} criado!</h1>
          <p className="text-becker-slate mt-1">Agora é só finalizar o pagamento</p>
        </div>

        <PaymentClient
          orderId={order.id}
          orderNumber={order.number}
          total={Number(order.total)}
          paymentMethod={order.paymentMethod || 'pix'}
          paymentId={order.paymentId || undefined}
          cardError={erro === 'cartao'}
          viewToken={viewToken}
          simulationEnabled={process.env.MERCADOPAGO_SANDBOX === 'true'}
        />
      </div>
    </PageShell>
  );
}
