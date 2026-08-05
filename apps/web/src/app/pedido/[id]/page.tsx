// ============================================================
// Página de pedido do cliente
// Sprint 2: tracking visual com timeline
// ============================================================

import { prisma } from '@becker/db';
import { TrackingTimeline } from './TrackingTimeline';
import { PageShell } from '@/components/PageShell';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Aceita tanto ID quanto número
  const order = await prisma.order.findFirst({
    where: { OR: [{ id }, { number: id }] },
    include: { items: true, address: true, user: true },
  });

  if (!order) {
    return (
      <PageShell>
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-extrabold mb-2">Pedido não encontrado</h1>
          <p className="text-becker-slate">Verifique o número e tente novamente.</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header do pedido */}
        <div className="bg-white rounded-2xl border border-becker-line p-6 mb-4">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <div className="text-xs text-becker-slate uppercase">Pedido</div>
              <h1 className="text-2xl font-extrabold font-mono">{order.number}</h1>
              <div className="text-sm text-becker-slate mt-1">
                {new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
              </div>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Tracking Timeline */}
          <TrackingTimeline status={order.status} tracking={order.tracking} />
        </div>

        {/* Itens */}
        <div className="bg-white rounded-2xl border border-becker-line p-6 mb-4">
          <h2 className="font-extrabold text-lg mb-4">Itens do pedido</h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-3 py-2 border-b border-becker-line last:border-0">
                <div>
                  <div className="font-semibold">{item.productName}</div>
                  <div className="text-xs text-becker-slate">{item.versionLabel} • {item.qty}x</div>
                </div>
                <div className="font-bold text-right">
                  R$ {Number(item.total).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          {/* Totais */}
          <div className="mt-4 pt-4 border-t-2 border-becker-line space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>R$ {Number(order.subtotal).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-eco-600">
                <span>Desconto</span>
                <span>-R$ {Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Frete</span>
              <span>{Number(order.shipping) === 0 ? '🎁 Grátis' : `R$ ${Number(order.shipping).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-lg font-extrabold pt-2 border-t border-becker-line">
              <span>Total</span>
              <span className="text-becker-purple">R$ {Number(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Endereço */}
        {order.address && (
          <div className="bg-white rounded-2xl border border-becker-line p-6 mb-4">
            <h2 className="font-extrabold text-lg mb-3">📍 Endereço de entrega</h2>
            <div className="text-sm">
              <div>{order.address.street}, {order.address.number}{order.address.complement ? ` - ${order.address.complement}` : ''}</div>
              <div>{order.address.district} — {order.address.city}/{order.address.state}</div>
              <div className="text-becker-slate">CEP {order.address.cep}</div>
            </div>
          </div>
        )}

        {/* WhatsApp CTA */}
        <div className="bg-eco-50 border border-eco-200 rounded-2xl p-6 text-center">
          <h3 className="font-extrabold mb-2">Dúvidas? Fala com a gente! 💬</h3>
          <p className="text-sm text-becker-slate mb-4">
            Acompanhe seu pedido, tire dúvidas ou faça alterações pelo WhatsApp
          </p>
          <a
            href={`https://wa.me/5581999022262?text=${encodeURIComponent(`Olá! Sobre meu pedido ${order.number}...`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-6 py-3 rounded-full"
          >
            💬 Falar pelo WhatsApp
          </a>
        </div>
      </div>
    </PageShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Aguardando pagamento', color: 'amber' },
    PAID: { label: 'Pago', color: 'blue' },
    PROCESSING: { label: 'Em separação', color: 'purple' },
    SHIPPED: { label: 'Enviado', color: 'sky' },
    DELIVERED: { label: 'Entregue', color: 'eco' },
    CANCELLED: { label: 'Cancelado', color: 'red' },
    REFUNDED: { label: 'Reembolsado', color: 'slate' },
  };
  const c = config[status] || { label: status, color: 'slate' };
  return (
    <span className={`text-xs font-bold uppercase bg-${c.color}-100 text-${c.color}-700 px-3 py-1.5 rounded-full`}>
      {c.label}
    </span>
  );
}
