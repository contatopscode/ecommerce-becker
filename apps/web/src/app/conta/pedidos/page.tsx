// ============================================================
// Conta > Pedidos (lista de pedidos do cliente logado)
// Sprint 2: lista com status, total, link de tracking
// ============================================================

import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MyOrdersPage() {
  const session = await getSession();

  if (!session) {
    redirect('/conta');
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold">Meus pedidos</h1>
          <Link href="/conta" className="text-becker-purple hover:underline text-sm font-semibold">
            ← Voltar
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-becker-line p-12 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-xl font-bold mb-2">Você ainda não fez nenhum pedido</h2>
            <p className="text-becker-slate mb-6">Explore nossos produtos e aproveite!</p>
            <Link
              href="/"
              className="inline-block bg-becker-purple text-white font-semibold px-6 py-3 rounded-full"
            >
              Ver produtos
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function OrderCard({ order }: { order: any }) {
  const statusConfig: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Aguardando pgto', color: 'amber' },
    PAID: { label: 'Pago', color: 'blue' },
    PROCESSING: { label: 'Em separação', color: 'purple' },
    SHIPPED: { label: 'A caminho', color: 'sky' },
    DELIVERED: { label: 'Entregue', color: 'eco' },
    CANCELLED: { label: 'Cancelado', color: 'red' },
  };
  const sc = statusConfig[order.status] || { label: order.status, color: 'slate' };

  return (
    <Link
      href={`/pedido/${order.number}`}
      className="block bg-white rounded-2xl border border-becker-line p-5 hover:border-becker-purple/30 hover:shadow-md transition"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-xs text-becker-slate">Pedido</div>
          <div className="font-mono font-bold text-lg">{order.number}</div>
          <div className="text-xs text-becker-slate mt-0.5">
            {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[10px] font-bold uppercase bg-${sc.color}-100 text-${sc.color}-700 px-2.5 py-1 rounded-full`}>
            {sc.label}
          </span>
          <div className="font-extrabold text-xl mt-1">R$ {Number(order.total).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-becker-slate">
        <span>{order.items.length} {order.items.length === 1 ? 'item' : 'itens'}</span>
        <span>•</span>
        <span className="text-becker-purple font-semibold">Ver detalhes →</span>
      </div>
    </Link>
  );
}
