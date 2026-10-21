// ============================================================
// Rastrear pedido
// ============================================================

'use client';

import { useState } from 'react';
import { getOrderAction, getMyOrdersAction } from '@/lib/actions';
import { formatPrice, statusLabel, statusColor, statusStepIndex } from '@/lib/utils';

interface TrackedOrder {
  id: string;
  number: string;
  date: string;
  status: string;
  total?: number;
  tracking?: string | null;
}

const STATUS_STEPS = ['Pago', 'Separação', 'Enviado', 'Entregue'];

export function RastrearClient() {
  const [orderId, setOrderId] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [orders, setOrders] = useState<TrackedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchByNumber = async () => {
    setError('');
    if (!orderId.trim() || phone.replace(/\D/g, '').length < 10) {
      setError('Informe o número do pedido e o WhatsApp usado na compra.');
      return;
    }
    setLoading(true);
    const result = await getOrderAction(orderId.trim().toUpperCase(), phone);
    setOrders([]);
    setLoading(false);
    if (result.ok) {
      setOrder(result.order);
    } else {
      setOrder(null);
      setError(result.error);
    }
  };

  const searchMine = async () => {
    setError('');
    setLoading(true);
    const result = await getMyOrdersAction();
    setLoading(false);
    setOrder(null);
    if (!result.authenticated) {
      setOrders([]);
      setError('Entre na sua conta para ver todos os seus pedidos.');
      return;
    }
    setOrders(result.orders);
    if (result.orders.length === 0) setError('Você ainda não tem pedidos.');
  };

  return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="display text-3xl font-extrabold mb-2">Rastrear pedido</h1>
        <p className="text-becker-slate mb-6">Acompanhe o status dos seus pedidos em tempo real.</p>

        <div className="bg-white rounded-3xl border border-becker-line p-6 mb-6">
          <label className="text-sm font-semibold block mb-2">Número do pedido e WhatsApp da compra</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.toUpperCase())}
              placeholder="BKR-202608-XXXXXX"
              className="flex-1 border border-becker-line rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-becker-purple"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className="flex-1 border border-becker-line rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-becker-purple"
            />
            <button
              onClick={searchByNumber}
              disabled={loading}
              className="bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full text-sm disabled:opacity-50"
            >
              Buscar
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mt-3" role="alert">{error}</p>}
          <button onClick={searchMine} disabled={loading} className="text-sm text-becker-purple font-semibold mt-4 underline">
            Já tenho conta: ver meus pedidos
          </button>
        </div>

        {order && <OrderCard order={order} />}
        {orders.length > 0 && (
          <div className="space-y-3">
            <h2 className="display text-lg font-bold mt-6">Pedidos encontrados</h2>
            {orders.map((o) => <OrderCard key={o.id} order={o} />)}
          </div>
        )}
      </div>
  );
}

function OrderCard({ order }: { order: TrackedOrder }) {
  const stepIdx = statusStepIndex(order.status);
  const color = statusColor(order.status);
  return (
    <div className="bg-white rounded-2xl border border-becker-line p-5 mb-3">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="display font-bold text-lg">{order.number}</div>
          <div className="text-xs text-becker-slate">Realizado em {new Date(order.date).toLocaleDateString('pt-BR')}</div>
        </div>
        <span className={`text-xs font-bold uppercase bg-${color}-100 text-${color}-700 px-3 py-1 rounded-full whitespace-nowrap`}>
          {statusLabel(order.status)}
        </span>
      </div>
      {order.status !== 'PENDING' && order.status !== 'CANCELLED' && stepIdx > 0 && (
        <div className="flex items-center justify-between gap-2 mb-3">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex-1 text-center">
              <div className={`w-8 h-8 mx-auto rounded-full grid place-items-center text-xs font-bold ${i <= stepIdx ? `bg-${color}-500 text-white` : 'bg-becker-line text-becker-slate'}`}>
                {i + 1}
              </div>
              <div className={`text-[10px] mt-1 ${i <= stepIdx ? 'text-becker-ink font-semibold' : 'text-becker-slate'}`}>
                {s}
              </div>
            </div>
          ))}
        </div>
      )}
      {order.tracking && (
        <div className="text-xs text-becker-slate">
          📦 Rastreio: <strong>{order.tracking}</strong>
        </div>
      )}
      {order.total && (
        <div className="text-sm text-becker-slate mt-2">
          Total: <strong>{formatPrice(order.total)}</strong>
        </div>
      )}
    </div>
  );
}
