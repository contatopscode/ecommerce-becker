// ============================================================
// DeliveryTimeline - parte interativa da página de detalhe do pedido
// Mostra timeline + ações (criar delivery, atualizar motoboy, etc)
// ============================================================

'use client';

import { useState } from 'react';
import { toast } from '@/lib/cart';

interface DeliveryEvent {
  id: string;
  type: string;
  actor: string;
  message: string | null;
  createdAt: string;
}

interface Delivery {
  id: string;
  status: string;
  motoboyName: string | null;
  motoboyPhone: string | null;
  outForDeliveryAt: string | null;
  deliveredAt: string | null;
  problemAt: string | null;
  problemNote: string | null;
  confirmToken: string;
  events: DeliveryEvent[];
}

interface Props {
  delivery: Delivery | null;
  orderId: string;
  orderNumber: string;
  customerPhone: string | null | undefined;
}

const STATUS_LABELS: Record<string, { label: string; color: string; emoji: string }> = {
  PENDING: { label: 'Aguardando sair', color: 'bg-yellow-100 text-yellow-800', emoji: '⏳' },
  OUT_FOR_DELIVERY: { label: 'Saiu pra entrega', color: 'bg-indigo-100 text-indigo-800', emoji: '🚚' },
  DELIVERED: { label: 'Entregue', color: 'bg-green-100 text-green-800', emoji: '✅' },
  DELIVERED_WITH_ISSUE: { label: 'Entregue c/ problema', color: 'bg-orange-100 text-orange-800', emoji: '⚠️' },
  FAILED: { label: 'Falhou', color: 'bg-red-100 text-red-800', emoji: '❌' },
};

const EVENT_LABELS: Record<string, { label: string; emoji: string }> = {
  out_for_delivery: { label: 'Saiu pra entrega', emoji: '🚚' },
  confirmed_ok: { label: 'Cliente confirmou', emoji: '✅' },
  problem: { label: 'Cliente reportou problema', emoji: '⚠️' },
  reminder: { label: 'Lembrete 24h enviado', emoji: '🔔' },
  failed: { label: 'Falha na entrega', emoji: '❌' },
  manual_update: { label: 'Atualização manual', emoji: '✏️' },
};

export function DeliveryTimeline({ delivery, orderId, orderNumber, customerPhone }: Props) {
  const [dispatching, setDispatching] = useState(false);
  const [motoboyName, setMotoboyName] = useState(delivery?.motoboyName || '');
  const [motoboyPhone, setMotoboyPhone] = useState(delivery?.motoboyPhone || '');

  const dispatch = async () => {
    if (!motoboyName.trim()) {
      toast('Informe o nome do motoboy', 'error');
      return;
    }
    setDispatching(true);
    try {
      // 1. Cria delivery + envia WhatsApp "saiu pra entrega"
      const r1 = await fetch('/api/admin/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, motoboyName, motoboyPhone }),
      });
      const d1 = await r1.json();
      if (!d1.ok) {
        toast(d1.error || 'Erro ao criar delivery', 'error');
        setDispatching(false);
        return;
      }
      // 2. Marca pedido como SHIPPED (também tenta criar delivery, mas é idempotente)
      const r2 = await fetch('/api/admin/pedidos/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          status: 'SHIPPED',
          motoboyName,
          motoboyPhone,
        }),
      });
      const d2 = await r2.json();
      if (d2.ok) {
        toast('🚚 Saiu pra entrega! WhatsApp enviado ao cliente.', 'success');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast(d2.error || 'Erro ao marcar como enviado', 'error');
      }
    } catch (e) {
      toast('Erro de conexão', 'error');
    }
    setDispatching(false);
  };

  const sendManualReminder = async () => {
    try {
      const r = await fetch('/api/cron/delivery-reminders', { method: 'POST' });
      const d = await r.json();
      if (d.ok) {
        toast(`🔔 Lembrete enviado (${d.sent} delivery)`, 'success');
      } else {
        toast(d.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-becker-line p-5">
        <h2 className="font-bold text-becker-ink mb-4">🚚 Entrega (Sprint 12)</h2>

        {!delivery ? (
          <div>
            <p className="text-sm text-becker-slate mb-3">
              Nenhuma delivery criada. Quando o pedido for marcado como <strong>SHIPPED</strong>,
              o sistema cria a delivery automaticamente e envia WhatsApp ao cliente.
            </p>
            <div className="text-xs text-becker-slate mb-3">
              💡 Ou dispatch manualmente agora:
            </div>
            <div className="space-y-2 mb-3">
              <input
                value={motoboyName}
                onChange={(e) => setMotoboyName(e.target.value)}
                placeholder="Nome do motoboy (ex: João Silva)"
                className="w-full border border-becker-line rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={motoboyPhone}
                onChange={(e) => setMotoboyPhone(e.target.value)}
                placeholder="(81) 99999-9999 (opcional)"
                className="w-full border border-becker-line rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={dispatch}
              disabled={dispatching}
              className="w-full bg-becker-orange hover:brightness-95 transition text-white font-bold py-2.5 rounded-lg text-sm disabled:opacity-50"
            >
              {dispatching ? 'Enviando...' : '🚚 Dispatch + enviar WhatsApp'}
            </button>
          </div>
        ) : (
          <div>
            {/* Status atual */}
            <div className="mb-4">
              <div className="text-xs text-becker-slate mb-1">Status atual</div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${STATUS_LABELS[delivery.status]?.color}`}>
                {STATUS_LABELS[delivery.status]?.emoji} {STATUS_LABELS[delivery.status]?.label}
              </div>
            </div>

            {/* Motoboy */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              <div>
                <div className="text-xs text-becker-slate">Motoboy</div>
                <div className="font-semibold">{delivery.motoboyName || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-becker-slate">Telefone</div>
                <div className="font-semibold">{delivery.motoboyPhone || '—'}</div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-1 text-xs text-becker-slate mb-4">
              {delivery.outForDeliveryAt && (
                <div>🚚 Saiu: {new Date(delivery.outForDeliveryAt).toLocaleString('pt-BR')}</div>
              )}
              {delivery.deliveredAt && (
                <div>✅ Confirmado: {new Date(delivery.deliveredAt).toLocaleString('pt-BR')}</div>
              )}
              {delivery.problemAt && (
                <div className="text-orange-600">
                  ⚠️ Problema: {new Date(delivery.problemAt).toLocaleString('pt-BR')}
                  {delivery.problemNote && <div className="ml-4">"{delivery.problemNote}"</div>}
                </div>
              )}
            </div>

            {/* Link pro cliente (debug) */}
            {customerPhone && (
              <div className="text-xs text-becker-slate mb-4 p-2 bg-becker-cream rounded">
                📞 Cliente: <strong>{customerPhone}</strong>
                <br />
                🔗 Link confirmar: <a
                  href={`/api/delivery/confirm?token=${delivery.confirmToken}&action=confirm`}
                  className="text-becker-purple underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  /api/delivery/confirm?token=...
                </a>
              </div>
            )}

            {/* Ações */}
            {delivery.status === 'OUT_FOR_DELIVERY' && (
              <button
                onClick={sendManualReminder}
                className="w-full bg-becker-line text-becker-ink font-semibold py-2 rounded-lg text-sm hover:bg-becker-purple-soft"
              >
                🔔 Enviar lembrete 24h agora
              </button>
            )}

            {/* Timeline */}
            <div className="mt-5 pt-5 border-t border-becker-line">
              <div className="text-xs font-bold text-becker-ink mb-3">📜 Histórico</div>
              {delivery.events.length === 0 ? (
                <div className="text-xs text-becker-slate">Sem eventos ainda.</div>
              ) : (
                <div className="space-y-2">
                  {delivery.events.map((ev) => (
                    <div key={ev.id} className="flex gap-2 text-xs">
                      <div className="text-lg leading-none">
                        {EVENT_LABELS[ev.type]?.emoji || '•'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-becker-ink">
                          {EVENT_LABELS[ev.type]?.label || ev.type}
                        </div>
                        {ev.message && <div className="text-becker-slate">{ev.message}</div>}
                        <div className="text-becker-slate text-[10px] mt-0.5">
                          {new Date(ev.createdAt).toLocaleString('pt-BR')} · {ev.actor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
