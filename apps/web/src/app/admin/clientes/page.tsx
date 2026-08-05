// ============================================================
// Admin Clientes (Sprint 3 melhorado)
// - Lista de clientes
// - Promover/rebaixar role (CUSTOMER <-> ADMIN <-> SUPER_ADMIN)
// - Ver pedidos
// ============================================================

import { prisma } from '@becker/db';
import { ClientesTable } from './ClientesTable';

export const dynamic = 'force-dynamic';

export default async function AdminClientesPage() {
  const customers = await prisma.user.findMany({
    where: { role: { in: ['CUSTOMER', 'ADMIN'] } },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { orders: true } },
      orders: {
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    take: 100,
  });

  // Calcular total gasto por cliente
  const enriched = customers.map((c) => ({
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    email: c.email,
    role: c.role,
    createdAt: c.createdAt,
    orderCount: c._count.orders,
    totalSpent: c.orders.reduce((sum, o) => sum + Number(o.total), 0),
    lastOrderAt: c.orders[0]?.createdAt || null,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-becker-ink">Clientes</h1>
          <p className="text-sm text-becker-slate mt-1">
            {enriched.length} cliente{enriched.length !== 1 ? 's' : ''} cadastrado{enriched.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ClientesTable customers={enriched} />
    </div>
  );
}
