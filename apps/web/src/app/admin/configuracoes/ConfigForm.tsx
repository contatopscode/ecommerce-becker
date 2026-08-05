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
  integrations: { label: '🔌 Integrações', icon: '🔌' },
  general: { label: '⚙️ Geral', icon: '⚙️' },
};

export function ConfigForm({ settings, session }: { settings: Setting[]; session: any }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(settings.map((s) => [s.key, s.value]))
  );
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('shipping');
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [detectingChat, setDetectingChat] = useState(false);

  const grouped = settings.reduce<Record<string, Setting[]>>((acc, s) => {
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

  const testTelegram = async () => {
    setTestingTelegram(true);
    try {
      const res = await fetch('/api/telegram/test', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast('Mensagem de teste enviada! Verifica o Telegram.', 'success');
      } else {
        toast(`Erro: ${data.error}`, 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setTestingTelegram(false);
  };

  const detectChatId = async () => {
    setDetectingChat(true);
    try {
      const res = await fetch('/api/telegram/setup', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast(`✓ Chat ID detectado e salvo!`, 'success');
        setValues({ ...values, integrations_telegram_chat_id: data.chatId });
      } else {
        // Mostra passos detalhados
        const steps = (data.steps || []).join('\n');
        const hint = data.hint || data.error || 'Erro';
        alert(`❌ ${hint}\n\n${steps}`);
        toast('Siga as instruções', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setDetectingChat(false);
  };

  const setManualChatId = async () => {
    const chatId = prompt(
      'Cole aqui seu Telegram Chat ID (número, ex: 123456789):\n\n' +
      'Para descobrir: abra @userinfobot no Telegram e mande /start'
    );
    if (!chatId) return;
    if (!/^-?\d+$/.test(chatId.trim())) {
      toast('Chat ID inválido. Deve ser só números.', 'error');
      return;
    }
    setDetectingChat(true);
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualChatId: chatId.trim(), testAfter: true }),
      });
      const data = await res.json();
      if (data.ok) {
        toast('✓ Chat ID salvo e testado!', 'success');
        setValues({ ...values, integrations_telegram_chat_id: chatId.trim() });
      } else {
        toast(data.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setDetectingChat(false);
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
            {values.integrations_telegram_bot_token && (
              <div className="space-y-2">
                <button
                  onClick={detectChatId}
                  disabled={detectingChat}
                  className="w-full bg-becker-purple text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
                >
                  {detectingChat ? 'Detectando...' : '🔍 Detectar meu Chat ID automaticamente'}
                </button>
                <button
                  onClick={setManualChatId}
                  disabled={detectingChat}
                  className="w-full bg-white border-2 border-becker-line text-becker-ink font-semibold py-2 rounded-xl disabled:opacity-50 text-sm"
                >
                  ⌨️ Ou digitar manualmente
                </button>
                <div className="text-xs text-becker-slate text-center">
                  💡 <strong>Não funciona a detecção?</strong> Abra o Telegram, procure
                  <code className="bg-becker-cream px-1 mx-1 rounded">@userinfobot</code>,
                  mande <code className="bg-becker-cream px-1 rounded">/start</code> e ele te dá teu ID.
                </div>
              </div>
            )}
            {values.integrations_telegram_bot_token && values.integrations_telegram_chat_id && (
              <button
                onClick={testTelegram}
                disabled={testingTelegram}
                className="w-full bg-eco-500 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
              >
                {testingTelegram ? 'Enviando...' : '📤 Enviar mensagem de teste'}
              </button>
            )}
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
