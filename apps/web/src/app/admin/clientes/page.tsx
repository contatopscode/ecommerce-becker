// ============================================================
// Admin Clientes
// ============================================================

import { prisma } from '@becker/db';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminClientesPage() {
  const customers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      _count: { select: { orders: true } },
      orders: { select: { total: true, createdAt: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-becker-ink">Clientes</h1>
        <span className="text-sm text-becker-slate">{customers.length} cliente{customers.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bg-white rounded-2xl border border-becker-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-becker-cream">
              <tr className="text-left text-becker-slate">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3">Última compra</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-t border-becker-line">
                  <td className="px-4 py-3 font-semibold">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs">{c.whatsapp}</td>
                  <td className="px-4 py-3">{c._count.orders}</td>
                  <td className="px-4 py-3 text-xs">
                    {c.orders[0] ? new Date(c.orders[0].createdAt).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      c.role === 'SUPER_ADMIN' ? 'bg-becker-purple text-white' :
                      c.role === 'ADMIN' ? 'bg-becker-orange text-white' :
                      'bg-becker-line text-becker-slate'
                    }`}>
                      {c.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
