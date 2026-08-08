'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

interface Cart {
  id: string;
  whatsapp: string;
  customerName: string | null;
  items: any[];
  subtotal: number;
  totalItems: number;
  cupom: string | null;
  sent1h: boolean;
  sent1hAt: string | null;
  sent24h: boolean;
  sent24hAt: string | null;
  sent72h: boolean;
  sent72hAt: string | null;
  converted: boolean;
  orderId: string | null;
  lastSeenAt: string;
  createdAt: string;
}

export default function CarrinhosPage() {
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'abandoned'>('abandoned');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadCarts();
  }, [filter]);

  async function loadCarts() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cart/abandoned?only=${filter}`);
      const data = await res.json();
      if (data.ok) setCarts(data.carts);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function triggerProcess() {
    if (!confirm('Disparar processamento de carrinhos abandonados agora? Vai enviar WhatsApp para os elegíveis.')) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/cart/process-abandoned', {
        method: 'POST',
        headers: { 'x-backup-token': window.prompt('Token de backup:') || '' },
      });
      const data = await res.json();
      if (data.ok) {
        alert(`✅ Processado!\n1h: ${data.sent1h}\n24h: ${data.sent24h}\n72h: ${data.sent72h}\nLimpos: ${data.cleaned}`);
        loadCarts();
      } else {
        alert('❌ ' + data.error);
      }
    } catch (e: any) {
      alert('Erro: ' + e.message);
    }
    setProcessing(false);
  }

  function formatDate(d: string | null) {
    if (!d) return '—';
    const date = new Date(d);
    return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  const stats = {
    total: carts.length,
    converted: carts.filter((c) => c.converted).length,
    sent1h: carts.filter((c) => c.sent1h).length,
    sent24h: carts.filter((c) => c.sent24h).length,
    sent72h: carts.filter((c) => c.sent72h).length,
    totalValue: carts.reduce((sum, c) => sum + c.subtotal, 0),
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold">🛒 Carrinhos Abandonados</h1>
          <p className="text-becker-slate text-sm">Recuperação de vendas via WhatsApp (1h, 24h, 72h)</p>
        </div>
        <button
          onClick={triggerProcess}
          disabled={processing}
          className="bg-becker-purple text-white font-semibold px-4 py-2 rounded-full disabled:opacity-50"
        >
          {processing ? 'Processando...' : '⚡ Processar agora'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Convertidos" value={stats.converted} color="green" />
        <StatCard label="Valor total" value={formatPrice(stats.totalValue)} />
        <StatCard label="Mensagens 1h" value={stats.sent1h} />
        <StatCard label="Mensagens 24h" value={stats.sent24h} />
        <StatCard label="Mensagens 72h" value={stats.sent72h} />
        <StatCard
          label="Taxa conversão"
          value={`${stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0}%`}
        />
        <StatCard
          label="Recuperáveis"
          value={stats.total - stats.sent72h}
          color="purple"
        />
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('abandoned')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === 'abandoned' ? 'bg-becker-purple text-white' : 'bg-white border border-becker-line'
          }`}
        >
          🚨 Abandonados (não convertidos)
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            filter === 'all' ? 'bg-becker-purple text-white' : 'bg-white border border-becker-line'
          }`}
        >
          📋 Todos
        </button>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-12 text-becker-slate">Carregando...</div>
      ) : carts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-becker-line p-12 text-center text-becker-slate">
          🎉 Nenhum carrinho {filter === 'abandoned' ? 'abandonado' : 'salvo'}.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-becker-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-becker-cream/50 border-b border-becker-line">
                <tr>
                  <th className="text-left p-3 font-semibold">Cliente</th>
                  <th className="text-left p-3 font-semibold">Itens</th>
                  <th className="text-right p-3 font-semibold">Valor</th>
                  <th className="text-center p-3 font-semibold">Cupom</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Última atividade</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr key={cart.id} className="border-b border-becker-line hover:bg-becker-cream/30">
                    <td className="p-3">
                      <div className="font-semibold">{cart.customerName || 'Sem nome'}</div>
                      <a
                        href={`https://wa.me/${cart.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-becker-purple hover:underline"
                      >
                        📱 {cart.whatsapp}
                      </a>
                    </td>
                    <td className="p-3">
                      <div className="text-xs">
                        {cart.items.slice(0, 2).map((item: any, i: number) => (
                          <div key={i} className="truncate max-w-[200px]">
                            {item.qty}x {item.name}
                          </div>
                        ))}
                        {cart.items.length > 2 && (
                          <div className="text-becker-slate">+{cart.items.length - 2} mais</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right font-semibold">{formatPrice(cart.subtotal)}</td>
                    <td className="p-3 text-center text-xs">
                      {cart.cupom ? (
                        <span className="bg-eco-100 text-eco-700 px-2 py-0.5 rounded font-mono">
                          {cart.cupom}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {cart.converted ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
                          ✅ Convertido
                        </span>
                      ) : (
                        <div className="flex gap-1 justify-center text-[10px]">
                          <MsgBadge sent={cart.sent1h} label="1h" />
                          <MsgBadge sent={cart.sent24h} label="24h" />
                          <MsgBadge sent={cart.sent72h} label="72h" />
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-becker-slate">{formatDate(cart.lastSeenAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color?: 'green' | 'purple' }) {
  const colorClass = color === 'green' ? 'text-green-600' : color === 'purple' ? 'text-becker-purple' : '';
  return (
    <div className="bg-white rounded-xl border border-becker-line p-3">
      <div className="text-xs text-becker-slate">{label}</div>
      <div className={`text-xl font-extrabold ${colorClass}`}>{value}</div>
    </div>
  );
}

function MsgBadge({ sent, label }: { sent: boolean; label: string }) {
  return (
    <span
      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
        sent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
      }`}
      title={sent ? 'Enviada' : 'Não enviada'}
    >
      {label} {sent ? '✓' : '○'}
    </span>
  );
}
