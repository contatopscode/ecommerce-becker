// ============================================================
// Admin Leads — clientes pré-cadastrados (não finalizaram compra)
// Sprint 3: captura leads via checkout (digitou WhatsApp mas não pagou)
// ============================================================

import { prisma } from '@becker/db';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  // Clientes que foram criados (pré-cadastro) mas nunca fizeram pedido
  // OU que pediram mas não pagaram
  const allCustomers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
    include: {
      orders: { select: { id: true, status: true, total: true, createdAt: true } },
    },
  });

  // Filtra: customers sem pedidos pagos
  const leads = allCustomers.filter((c) => {
    return !c.orders.some((o) => o.status === 'PAID' || o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'DELIVERED');
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-becker-ink">Leads (pré-cadastros)</h1>
          <p className="text-sm text-becker-slate mt-1">
            Clientes que iniciaram checkout mas não finalizaram compra
          </p>
        </div>
        <span className="text-sm font-bold bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full">
          {leads.length} lead{leads.length !== 1 ? 's' : ''}
        </span>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-becker-line p-12 text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-xl font-bold mb-2">Nenhum lead ainda</h2>
          <p className="text-becker-slate text-sm">
            Quando clientes digitarem o WhatsApp no checkout, eles aparecem aqui.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-becker-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-becker-cream">
                <tr className="text-left text-becker-slate">
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Pedidos</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Cadastrado</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const abandonedOrder = lead.orders.find((o) => o.status === 'PENDING' || o.status === 'CANCELLED');
                  return (
                    <tr key={lead.id} className="border-t border-becker-line">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{lead.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{lead.whatsapp}</td>
                      <td className="px-4 py-3 text-xs text-becker-slate">{lead.email || '—'}</td>
                      <td className="px-4 py-3">{lead.orders.length}</td>
                      <td className="px-4 py-3">
                        {abandonedOrder ? (
                          <span className="text-xs font-bold uppercase bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            Abandono • R$ {Number(abandonedOrder.total).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-xs font-bold uppercase bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                            Sem pedido
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-becker-slate">
                        {new Date(lead.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`https://wa.me/${(lead.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Oi ${lead.name.split(' ')[0]}! Vi que você quase fechou um pedido na Becker. Posso te ajudar a finalizar?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold bg-[#25D366] text-white px-3 py-1.5 rounded-full inline-flex items-center gap-1"
                        >
                          💬 Chamar
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
