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
  const [testWhatsapp, setTestWhatsapp] = useState('');
  const [testResult, setTestResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [testSending, setTestSending] = useState(false);

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
        headers: { 'x-cron-token': window.prompt('CRON_TOKEN:') || '' },
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

  async function sendTestMessage(type: '1h' | '24h' | '72h') {
    if (!testWhatsapp) {
      setTestResult({ type: 'error', message: 'Digite um WhatsApp' });
      return;
    }
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/cart/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: testWhatsapp, type }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestResult({
          type: 'success',
          message: `✅ ${type} enviado! ID: ${data.messageId} | Para: ${data.sentTo} | ${data.items} itens | ${formatPrice(data.subtotal)}`,
        });
        loadCarts(); // recarrega pra mostrar o carrinho criado
      } else {
        setTestResult({ type: 'error', message: data.error || 'Erro' });
      }
    } catch (e: any) {
      setTestResult({ type: 'error', message: e.message });
    }
    setTestSending(false);
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

      {/* 🧪 PAINEL DE TESTE */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="text-3xl">🧪</div>
          <div className="flex-1">
            <div className="font-extrabold text-lg mb-1">Validar WhatsApp</div>
            <p className="text-sm text-becker-slate">
              Testa o envio das mensagens sem precisar esperar 1h/24h/72h. Usa produtos reais do banco e salva o carrinho pra ficar no histórico.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Seu WhatsApp (ex: 81999998888)"
            value={testWhatsapp}
            onChange={(e) => setTestWhatsapp(e.target.value)}
            className="flex-1 border-2 border-becker-line rounded-xl px-4 py-2.5 focus:border-becker-purple outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => sendTestMessage('1h')}
              disabled={testSending || !testWhatsapp}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50 text-sm"
            >
              📩 Testar 1h
            </button>
            <button
              onClick={() => sendTestMessage('24h')}
              disabled={testSending || !testWhatsapp}
              className="bg-purple-500 hover:bg-purple-600 text-white font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50 text-sm"
            >
              📩 Testar 24h
            </button>
            <button
              onClick={() => sendTestMessage('72h')}
              disabled={testSending || !testWhatsapp}
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50 text-sm"
            >
              📩 Testar 72h
            </button>
          </div>
        </div>

        {testResult && (
          <div
            className={`mt-3 p-3 rounded-xl text-sm ${
              testResult.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {testResult.message}
          </div>
        )}

        <details className="mt-3 text-xs text-becker-slate">
          <summary className="cursor-pointer font-semibold">💡 Como testar o fluxo completo (carrinho real abandonado)</summary>
          <ol className="list-decimal pl-5 mt-2 space-y-1">
            <li>Abra a loja em aba anônima: <a href="/" className="underline">becker.pscode.ia.br</a></li>
            <li>Adicione 1-2 produtos ao carrinho</li>
            <li>Vá no checkout e digite SEU WhatsApp no step 1</li>
            <li>Volte aqui e veja o carrinho aparecer na lista abaixo</li>
            <li>Use o botão "⚡ Processar agora" pra forçar envio (vai dar 401 se CRON_TOKEN não tá no Easypanel, mas dá pra testar manual com botões acima)</li>
            <li>Verifique se WhatsApp chegou no seu celular</li>
          </ol>
        </details>
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
