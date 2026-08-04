// ============================================================
// Página de pedido confirmado
// ============================================================

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageShell } from '@/components/PageShell';
import { getOrderAction } from '@/lib/actions';
import { formatPrice, statusLabel, statusColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderAction(id);
  if (!order) notFound();

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-becker-line p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-eco-500 mx-auto grid place-items-center text-4xl text-white mb-4">✓</div>
          <h1 className="display text-3xl font-extrabold mb-2">Pedido confirmado!</h1>
          <p className="text-becker-slate mb-6">
            Recebemos seu pedido e já estamos separando tudo com carinho 💜
          </p>

          <div className="bg-becker-cream rounded-2xl p-4 text-left mb-6">
            <div className="text-xs text-becker-slate uppercase font-semibold mb-1">Número do pedido</div>
            <div className="display text-2xl font-extrabold text-becker-purple">{order.number}</div>
            {order.tracking && (
              <div className="text-xs text-becker-slate mt-1">
                Rastreio: <strong>{order.tracking}</strong>
              </div>
            )}
            <div className="mt-3 pt-3 border-t border-becker-line text-sm">
              <div className="text-becker-slate">Total: <strong className="text-becker-purple">{formatPrice(order.total)}</strong></div>
              <div className="text-becker-slate text-xs">Status: {statusLabel(order.status)}</div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-becker-cream rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">📧</div>
              <div className="text-xs font-semibold">E-mail enviado</div>
            </div>
            <div className="bg-becker-cream rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">💬</div>
              <div className="text-xs font-semibold">WhatsApp</div>
            </div>
            <div className="bg-becker-cream rounded-2xl p-4 text-center">
              <div className="text-2xl mb-1">🚚</div>
              <div className="text-xs font-semibold">Envio em 2 dias</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/rastrear" className="bg-becker-purple text-white font-semibold px-6 py-3 rounded-full">
              Rastrear pedido
            </Link>
            <Link href="/" className="border-2 border-becker-purple text-becker-purple font-semibold px-6 py-3 rounded-full">
              Continuar comprando
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
