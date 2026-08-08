// ============================================================
// Checkout > Pagamento
// Sprint 6: integração Mercado Pago (PIX + Cartão)
// ============================================================

import { prisma } from '@becker/db';
import { PaymentClient } from './PaymentClient';
import { PageShell } from '@/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function CheckoutPaymentPage({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const { orderId } = await searchParams;

  if (!orderId) {
    return (
      <PageShell>
        <div className="text-center py-20">
          <h1 className="text-2xl font-extrabold">Pedido não encontrado</h1>
        </div>
      </PageShell>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true },
  });

  if (!order) {
    return (
      <PageShell>
        <div className="text-center py-20">
          <h1 className="text-2xl font-extrabold">Pedido não encontrado</h1>
        </div>
      </PageShell>
    );
  }

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
        />
      </div>
    </PageShell>
  );
}
