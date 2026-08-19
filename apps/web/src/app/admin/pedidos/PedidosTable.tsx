'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/lib/cart';

interface Order {
  id: string;
  number: string;
  createdAt: Date;
  status: string;
  paymentStatus: string;
  total: any;
  tracking: string | null;
  user: { name: string; whatsapp: string | null } | null;
  guestWhatsapp: string | null;
  items: Array<{ id: string; productName: string; versionLabel: string; qty: number; price: any; total: any }>;
  address: { city: string; state: string } | null;
}

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Aguardando pagamento' },
  { value: 'PAID', label: 'Pago' },
  { value: 'PROCESSING', label: 'Em separação' },
  { value: 'SHIPPED', label: 'Enviado' },
  { value: 'DELIVERED', label: 'Entregue' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

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

export function PedidosTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [tracking, setTracking] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const updateStatus = async (orderId: string) => {
    setLoading(orderId);
    try {
      const res = await fetch('/api/admin/pedidos/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus, tracking: tracking || undefined }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`Pedido atualizado para ${statusLabel(newStatus)}`, 'success');
        setEditing(null);
        setTracking('');
        router.refresh();
      } else {
        toast(data.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setLoading(null);
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-becker-line p-12 text-center">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-becker-slate">Nenhum pedido encontrado.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-becker-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-becker-cream">
            <tr className="text-left text-becker-slate">
              <th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Itens</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const customerName = o.user?.name || 'Visitante';
              const customerPhone = o.user?.whatsapp || o.guestWhatsapp || '-';
              const isEditing = editing === o.id;

              return (
                <tr key={o.id} className="border-t border-becker-line">
                  <td className="px-4 py-3">
                    <Link href={`/admin/pedidos/${o.id}`} className="font-mono text-xs text-becker-purple font-semibold hover:underline">
                      {o.number}
                    </Link>
                    <div className="text-[10px] text-becker-slate">
                      {new Date(o.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{customerName}</div>
                    <div className="text-xs text-becker-slate">{customerPhone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.items.slice(0, 2).map((i) => `${i.qty}x ${i.productName.split(' ')[0]}`).join(', ')}
                    {o.items.length > 2 && ` +${o.items.length - 2}`}
                  </td>
                  <td className="px-4 py-3 font-bold">R$ {Number(o.total).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold uppercase bg-${statusColor(o.status)}-100 text-${statusColor(o.status)}-700 px-2 py-1 rounded-full`}>
                      {statusLabel(o.status)}
                    </span>
                    {o.tracking && (
                      <div className="text-[10px] text-becker-slate mt-1">📦 {o.tracking}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div className="flex flex-col gap-1 min-w-[200px]">
                        <select
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          className="border border-becker-line rounded px-2 py-1 text-xs"
                        >
                          <option value="">Mudar para...</option>
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        {(newStatus === 'SHIPPED' || newStatus === 'PROCESSING') && (
                          <input
                            value={tracking}
                            onChange={(e) => setTracking(e.target.value)}
                            placeholder="Código de rastreio"
                            className="border border-becker-line rounded px-2 py-1 text-xs"
                          />
                        )}
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateStatus(o.id)}
                            disabled={!newStatus || loading === o.id}
                            className="bg-becker-purple text-white text-xs font-semibold px-2 py-1 rounded disabled:opacity-50"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="bg-becker-line text-becker-ink text-xs px-2 py-1 rounded"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditing(o.id);
                          setNewStatus(o.status);
                          setTracking(o.tracking || '');
                        }}
                        className="text-becker-purple text-xs font-semibold hover:underline"
                      >
                        Atualizar
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
