'use client';

import { useState } from 'react';
import { toast } from '@/lib/cart';

interface Setting {
  key: string;
  value: string;
  category: string;
  label: string;
  type: string;
}

const CATEGORIES = {
  shipping: { label: '🚚 Frete e Entrega', icon: '🚚' },
  promo: { label: '🎁 Promoções', icon: '🎁' },
  payments: { label: '💳 Pagamentos', icon: '💳' },
  integrations: { label: '🔌 Integrações', icon: '🔌' },
  general: { label: '⚙️ Geral', icon: '⚙️' },
};

// Settings default que devem existir mesmo se não foram criados ainda
const PAYMENT_DEFAULTS: Setting[] = [
  { key: 'payments_mp_access_token', value: '', category: 'payments', label: 'Mercado Pago - Access Token', type: 'text' },
  { key: 'payments_mp_public_key', value: '', category: 'payments', label: 'Mercado Pago - Public Key', type: 'text' },
  { key: 'payments_mp_sandbox', value: 'true', category: 'payments', label: 'Modo Sandbox (Teste)', type: 'boolean' },
  { key: 'payments_mp_webhook_url', value: '', category: 'payments', label: 'URL do Webhook (opcional)', type: 'text' },
  { key: 'payments_methods_enabled', value: 'pix,credit_card,boleto', category: 'payments', label: 'Métodos habilitados (separar por vírgula)', type: 'text' },
];

const PROMO_DEFAULTS: Setting[] = [
  { key: 'promo_first_buy_coupon', value: 'BECKER15', category: 'promo', label: 'Cupom automático de primeira compra', type: 'text' },
];

export function ConfigForm({ settings, session }: { settings: Setting[]; session: any }) {
  // Mescla settings existentes com defaults de payments
  const allSettings = [...settings];
  for (const def of PAYMENT_DEFAULTS) {
    if (!allSettings.find((s) => s.key === def.key)) {
      allSettings.push(def);
    }
  }
  for (const def of PROMO_DEFAULTS) {
    if (!allSettings.find((s) => s.key === def.key)) {
      allSettings.push(def);
    }
  }

  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(allSettings.map((s) => [s.key, s.value]))
  );
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('shipping');
  const [testingMP, setTestingMP] = useState(false);

  const grouped = allSettings.reduce<Record<string, Setting[]>>((acc, s) => {
    const cat = s.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: values }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('Configurações salvas ✓', 'success');
      } else {
        toast(data.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setSaving(false);
  };

  const testMercadoPago = async () => {
    setTestingMP(true);
    try {
      const res = await fetch('/api/admin/payments/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast(`✅ Conexão OK! Modo: ${data.mode === 'sandbox' ? 'Sandbox (Teste)' : 'Produção'}`, 'success');
      } else {
        toast(`❌ ${data.error}`, 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setTestingMP(false);
  };

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Tabs verticais */}
      <div className="space-y-1">
        {Object.entries(CATEGORIES).map(([key, info]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm ${
              activeCategory === key
                ? 'bg-becker-purple text-white'
                : 'bg-white border border-becker-line hover:border-becker-purple/30'
            }`}
          >
            {info.label}
          </button>
        ))}

        <div className="mt-6 p-4 bg-white border border-becker-line rounded-xl text-xs">
          <div className="text-becker-slate font-semibold mb-1">Sessão atual</div>
          <div className="font-bold">{session?.name}</div>
          <div className="text-becker-slate">{session?.whatsapp}</div>
          <div className="mt-1 inline-block text-[10px] font-bold bg-becker-purple text-white px-2 py-0.5 rounded">
            {session?.role}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-becker-line p-6">
        <h2 className="text-xl font-extrabold mb-4">
          {CATEGORIES[activeCategory as keyof typeof CATEGORIES]?.label}
        </h2>

        {activeCategory === 'integrations' && (
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              💡 Após preencher, clique em <strong>Salvar tudo</strong>. Tokens sensíveis usam campo tipo senha.
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800">
              <div className="font-semibold mb-1">📲 Notificações da equipe (internas):</div>
              <p className="text-xs">
                Quando houver <strong>novo pedido, pagamento, envio ou lead</strong>, vamos te enviar um resumo pelo <strong>WhatsApp do admin</strong> usando a Evolution API.
              </p>
              <p className="text-xs mt-1">
                Configure a URL, API Key, Instance e teu WhatsApp abaixo. As notificações pro cliente já usam a mesma Evolution (não precisa configurar).
              </p>
            </div>
            {values.integrations_evolution_url && values.integrations_admin_whatsapp && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/notify-test', { method: 'POST' });
                    const data = await res.json();
                    if (data.ok) toast('✅ Mensagem de teste enviada pro admin!', 'success');
                    else toast(`❌ ${data.error}`, 'error');
                  } catch {
                    toast('Erro de conexão', 'error');
                  }
                }}
                className="w-full bg-eco-500 text-white font-semibold py-2.5 rounded-xl"
              >
                📤 Enviar mensagem de teste pro admin
              </button>
            )}
          </div>
        )}

        {activeCategory === 'payments' && (
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-900">
              <div className="font-semibold mb-1">💳 Mercado Pago</div>
              <p className="text-xs">
                Configure suas credenciais do Mercado Pago. Obtenha em{' '}
                <a href="https://www.mercadopago.com.br/developers/panel/credentials" target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                  Developers Panel
                </a>.
              </p>
              <p className="text-xs mt-1">
                Em <strong>modo sandbox</strong>, use as credenciais de teste. Mude para <strong>produção</strong> quando estiver pronto.
              </p>
            </div>
            {values.payments_mp_access_token && (
              <button
                onClick={testMercadoPago}
                disabled={testingMP}
                className="w-full bg-eco-500 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                {testingMP ? 'Testando...' : '🔌 Testar conexão Mercado Pago'}
              </button>
            )}
          </div>
        )}

        {activeCategory === 'promo' && (
          <div className="mb-4 space-y-3">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-sm text-purple-900">
              <div className="font-semibold mb-1">🎁 Marketing via WhatsApp</div>
              <p className="text-xs">
                Cupom de primeira compra é aplicado <strong>automaticamente</strong> no checkout quando o cliente nunca comprou antes.
                Mensagens de carrinho abandonado (1h, 24h, 72h) são enviadas por WhatsApp via cron.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {(grouped[activeCategory] || []).map((s) => (
            <div key={s.key}>
              <label className="block text-sm font-semibold mb-1">{s.label}</label>
              {s.type === 'boolean' ? (
                <select
                  value={values[s.key] || 'false'}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  className="w-full border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none"
                >
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              ) : s.type === 'text' && (s.key.includes('token') || s.key.includes('key')) ? (
                <input
                  type="password"
                  value={values[s.key] || ''}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  placeholder="••••••••"
                  className="w-full border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none font-mono"
                />
              ) : (
                <input
                  type={s.type === 'number' ? 'number' : 'text'}
                  value={values[s.key] || ''}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  className="w-full border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none"
                />
              )}
              <p className="text-[10px] text-becker-slate mt-1 font-mono">{s.key}</p>
              {s.key === 'integrations_admin_whatsapp' && (
                <p className="text-[10px] text-amber-700 mt-1 font-sans">
                  💡 WhatsApp Business API usa formato SEM o 9. Ex: (81) 99944-1333 → <code className="bg-becker-cream px-1 rounded">5581999441333</code>. Sistema normaliza automático.
                </p>
              )}
              {s.key === 'payments_mp_sandbox' && (
                <p className="text-[10px] text-amber-700 mt-1 font-sans">
                  ⚠️ Em <strong>produção</strong>, desmarque essa opção. Use <strong>sandbox</strong> apenas para testes.
                </p>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="mt-6 w-full bg-becker-purple text-white font-bold py-3 rounded-xl disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </div>
    </div>
  );
}
