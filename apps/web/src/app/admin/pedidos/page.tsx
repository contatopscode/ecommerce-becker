// ============================================================
// Admin Pedidos - listagem + mudança de status
// ============================================================

import { prisma } from '@becker/db';
import Link from 'next/link';
import { PedidosTable } from './PedidosTable';

export const dynamic = 'force-dynamic';

async function getOrders(status?: string) {
  const where: any = {};
  if (status && status !== 'ALL') where.status = status;

  return prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { user: true, items: true, address: true },
  });
}

const STATUSES = [
  { id: 'ALL', label: 'Todos' },
  { id: 'PENDING', label: 'Aguardando' },
  { id: 'PAID', label: 'Pago' },
  { id: 'PROCESSING', label: 'Em separação' },
  { id: 'SHIPPED', label: 'Enviado' },
  { id: 'DELIVERED', label: 'Entregue' },
  { id: 'CANCELLED', label: 'Cancelado' },
];

export default async function AdminPedidosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = 'ALL' } = await searchParams;
  const orders = await getOrders(status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-becker-ink">Pedidos</h1>
        <div className="text-sm text-becker-slate">
          {orders.length} resultado{orders.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtros de status */}
      <div className="flex gap-2 overflow-x-auto mb-6 scroll-hide">
        {STATUSES.map((s) => (
          <Link
            key={s.id}
            href={`/admin/pedidos?status=${s.id}`}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${
              status === s.id
                ? 'bg-becker-purple text-white'
                : 'bg-white border border-becker-line text-becker-ink hover:border-becker-purple'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <PedidosTable orders={orders} />
    </div>
  );
}
