'use client';

import { useState } from 'react';

interface Conversation {
  id: string;
  phone: string;
  customerName: string | null;
  messages: any;
  resolved: boolean;
  humanTakeover: boolean;
  lastMessageAt: Date;
  createdAt: Date;
}

export function ConversasList({ conversations }: { conversations: Conversation[] }) {
  const [selected, setSelected] = useState<Conversation | null>(conversations[0] || null);
  const [filter, setFilter] = useState<'all' | 'open' | 'human'>('all');

  const filtered = conversations.filter((c) => {
    if (filter === 'open') return !c.resolved;
    if (filter === 'human') return c.humanTakeover;
    return true;
  });

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-becker-line p-12 text-center">
        <div className="text-6xl mb-4">💬</div>
        <h2 className="text-xl font-bold mb-2">Nenhuma conversa ainda</h2>
        <p className="text-becker-slate text-sm">
          Quando alguém mandar mensagem no WhatsApp da Becker, vai aparecer aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
      {/* Lista */}
      <div className="bg-white rounded-2xl border border-becker-line overflow-hidden flex flex-col">
        <div className="p-3 border-b border-becker-line">
          <div className="flex gap-1 text-xs">
            {(['all', 'open', 'human'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full ${
                  filter === f
                    ? 'bg-becker-purple text-white font-semibold'
                    : 'bg-becker-cream text-becker-slate'
                }`}
              >
                {f === 'all' ? 'Todas' : f === 'open' ? 'Abertas' : 'Humano'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className={`w-full text-left p-4 border-b border-becker-line hover:bg-becker-cream transition ${
                selected?.id === c.id ? 'bg-becker-purple-soft' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-becker-purple text-white grid place-items-center font-bold shrink-0">
                  {(c.customerName || c.phone).charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-sm truncate">
                      {c.customerName || c.phone}
                    </div>
                    <div className="text-[10px] text-becker-slate">
                      {new Date(c.lastMessageAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="text-xs text-becker-slate truncate">
                    {Array.isArray(c.messages) && c.messages.length > 0
                      ? (c.messages[c.messages.length - 1] as any).content?.substring(0, 50) + '...'
                      : '(sem mensagens)'}
                  </div>
                  <div className="flex gap-1 mt-1">
                    {c.humanTakeover && (
                      <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">👤 HUMANO</span>
                    )}
                    {c.resolved && (
                      <span className="text-[9px] font-bold bg-eco-100 text-eco-700 px-1.5 py-0.5 rounded">✓ RESOLVIDA</span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-becker-line flex flex-col overflow-hidden">
        {selected ? (
          <>
            <div className="p-4 border-b border-becker-line flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-becker-purple text-white grid place-items-center font-bold">
                {(selected.customerName || selected.phone).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold">{selected.customerName || 'Cliente'}</div>
                <div className="text-xs text-becker-slate">{selected.phone}</div>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-becker-cream/30">
              {Array.isArray(selected.messages) ? selected.messages.map((m: any, i: number) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-white border border-becker-line' : 'bg-becker-purple text-white'
                  }`}>
                    {m.content}
                  </div>
                </div>
              )) : <p className="text-sm text-becker-slate text-center">Sem mensagens</p>}
            </div>
            <div className="p-3 border-t border-becker-line bg-becker-cream text-xs text-becker-slate text-center">
              💡 Mensagens são geradas pelo agente IA automaticamente. Configure o webhook em /admin/configuracoes.
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-becker-slate">
            Selecione uma conversa
          </div>
        )}
      </div>
    </div>
  );
}
