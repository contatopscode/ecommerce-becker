'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/cart';

interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  role: string;
  createdAt: Date;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

export function ClientesTable({ customers }: { customers: Customer[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = customers.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.whatsapp || '').includes(search) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const changeRole = async (id: string, newRole: string) => {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/clientes/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, role: newRole }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Role alterado para ${newRole}`, 'success');
        router.refresh();
      } else {
        toast(data.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setBusy(null);
  };

  return (
    <>
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nome, WhatsApp ou e-mail..."
          className="w-full max-w-md border-2 border-becker-line rounded-xl px-4 py-2 focus:border-becker-purple outline-none"
        />
      </div>

      <div className="bg-white rounded-2xl border border-becker-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-becker-cream">
              <tr className="text-left text-becker-slate">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">WhatsApp</th>
                <th className="px-4 py-3">Pedidos</th>
                <th className="px-4 py-3">Total gasto</th>
                <th className="px-4 py-3">Último pedido</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-becker-line">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{c.name}</div>
                    {c.email && <div className="text-xs text-becker-slate">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.whatsapp}</td>
                  <td className="px-4 py-3">
                    {c.orderCount}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    R$ {c.totalSpent.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-xs text-becker-slate">
                    {c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('pt-BR') : '—'}
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
                  <td className="px-4 py-3">
                    <select
                      value={c.role}
                      onChange={(e) => changeRole(c.id, e.target.value)}
                      disabled={busy === c.id}
                      className="text-xs border border-becker-line rounded px-2 py-1 disabled:opacity-50"
                    >
                      <option value="CUSTOMER">Customer</option>
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-becker-slate">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado ainda'}
          </div>
        )}
      </div>
    </>
  );
}
