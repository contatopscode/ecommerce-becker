// ============================================================
// Checkout > Pagamento
// Sprint 6: integração Mercado Pago (PIX + Cartão)
// ============================================================

import { prisma } from '@becker/db';
import { notFound, redirect } from 'next/navigation';
import { PaymentClient } from './PaymentClient';
import { PageShell } from '@/components/PageShell';
import { orderIdFromToken } from '@/lib/auth/pedido-link';
import { canAccessOrderId } from '@/lib/auth/pedido-guard';

export const dynamic = 'force-dynamic';

export default async function CheckoutPaymentPage({ searchParams }: { searchParams: Promise<{ orderId?: string; erro?: string; t?: string }> }) {
  const { orderId, erro, t } = await searchParams;

  // Link com token válido: troca o ?t= por cookie de pagamento e vai para a URL sem t (destino fixo no servidor)
  if (orderId && t && orderIdFromToken(t) === orderId) {
    const e = erro === 'cartao' ? '&erro=cartao' : '';
    redirect(`/api/pedido/acesso?ref=${encodeURIComponent(orderId)}&t=${encodeURIComponent(t)}&next=pagamento${e}`);
  }

  // Mesma regra de /pedido/[id]: sessão dona/admin ou ?t= válido para este pedido. O id sozinho não basta,
  // e esta página nunca emite token. Inexistente e não autorizado dão a mesma resposta (404).
  if (!orderId || !(await canAccessOrderId(orderId, t))) notFound();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, address: true },
  });
  if (!order) notFound();

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
          viewToken={null}
          simulationEnabled={process.env.MERCADOPAGO_SANDBOX === 'true'}
        />
      </div>
    </PageShell>
  );
}
