// ============================================================
// Admin Dashboard
// ============================================================

import { prisma } from '@becker/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    totalCustomers,
    monthRevenue,
    monthOrders,
    todayOrders,
    recentOrders,
    topProducts,
    pendingOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.user.count(),
    prisma.order.aggregate({
      where: { createdAt: { gte: startOfMonth }, paymentStatus: 'PAID' },
      _sum: { total: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { user: true, items: true },
    }),
    prisma.product.findMany({
      where: { active: true, isTop: true },
      take: 5,
      include: { _count: { select: { reviews: true } }, versions: { take: 1, orderBy: { price: 'asc' } } },
    }),
    prisma.order.count({ where: { status: 'PENDING' } }),
  ]);

  return {
    totalProducts,
    totalCustomers,
    monthRevenue: Number(monthRevenue._sum.total || 0),
    monthOrders,
    todayOrders,
    recentOrders,
    topProducts,
    pendingOrders,
  };
}

function statusLabel(s: string) {
  return {
    PENDING: 'Aguardando',
    PAID: 'Pago',
    PROCESSING: 'Em separação',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
  }[s] || s;
}

function statusColor(s: string) {
  return {
    PENDING: 'amber',
    PAID: 'blue',
    PROCESSING: 'purple',
    SHIPPED: 'sky',
    DELIVERED: 'eco',
    CANCELLED: 'red',
  }[s] || 'slate';
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-becker-ink">Dashboard</h1>
        <span className="text-sm text-becker-slate">
          Atualizado: {new Date().toLocaleString('pt-BR')}
        </span>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-becker-line">
          <div className="text-xs text-becker-slate uppercase font-semibold">Vendas (mês)</div>
          <div className="text-3xl font-extrabold text-becker-purple mt-1">
            R$ {stats.monthRevenue.toFixed(2)}
          </div>
          <div className="text-xs text-eco-600 font-semibold mt-1">↑ últimos 30 dias</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-becker-line">
          <div className="text-xs text-becker-slate uppercase font-semibold">Pedidos (mês)</div>
          <div className="text-3xl font-extrabold text-becker-purple mt-1">{stats.monthOrders}</div>
          <div className="text-xs text-becker-slate mt-1">{stats.todayOrders} hoje</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-becker-line">
          <div className="text-xs text-becker-slate uppercase font-semibold">Produtos</div>
          <div className="text-3xl font-extrabold text-becker-purple mt-1">{stats.totalProducts}</div>
          <div className="text-xs text-becker-slate mt-1">ativos no catálogo</div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-becker-line">
          <div className="text-xs text-becker-slate uppercase font-semibold">Clientes</div>
          <div className="text-3xl font-extrabold text-becker-purple mt-1">{stats.totalCustomers}</div>
          <div className="text-xs text-becker-slate mt-1">cadastrados</div>
        </div>
      </div>

      {stats.pendingOrders > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <div className="font-semibold text-amber-800">
              {stats.pendingOrders} {stats.pendingOrders === 1 ? 'pedido aguardando' : 'pedidos aguardando'} pagamento
            </div>
            <div className="text-xs text-amber-700">Confirme os pagamentos para liberar separação</div>
          </div>
          <Link href="/admin/pedidos?status=PENDING" className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-full text-sm">
            Ver →
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-becker-line p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-sm text-becker-purple font-semibold">Ver todos →</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-becker-slate text-center py-8">Nenhum pedido ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-becker-slate border-b border-becker-line">
                    <th className="pb-2">Pedido</th>
                    <th className="pb-2">Cliente</th>
                    <th className="pb-2">Itens</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map((o) => (
                    <tr key={o.id} className="border-b border-becker-line last:border-0">
                      <td className="py-3 font-mono text-xs">{o.number}</td>
                      <td className="py-3">
                        {o.user?.name || o.guestWhatsapp || 'Visitante'}
                      </td>
                      <td className="py-3">{o.items.length}</td>
                      <td className="py-3 font-bold">R$ {Number(o.total).toFixed(2)}</td>
                      <td className="py-3">
                        <span className={`text-xs font-bold uppercase bg-${statusColor(o.status)}-100 text-${statusColor(o.status)}-700 px-2 py-1 rounded-full`}>
                          {statusLabel(o.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Top produtos */}
        <section className="bg-white rounded-2xl border border-becker-line p-6">
          <h2 className="text-xl font-extrabold mb-4">Top produtos</h2>
          <div className="space-y-3">
            {stats.topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="text-2xl font-bold text-becker-slate w-6">#{i + 1}</div>
                <div className="w-10 h-10 rounded-xl bg-becker-cream grid place-items-center text-xl">📦</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">{p.name}</div>
                  <div className="text-xs text-becker-slate">
                    R$ {p.versions[0] ? Number(p.versions[0].price).toFixed(2) : '0'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
