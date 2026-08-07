// ============================================================
// WhatsApp Admin Notify - notificação interna via Evolution
// Sprint 8+: substitui Telegram (que não tá acessível)
// Manda notificações da equipe pro WhatsApp do admin
// ============================================================

import { prisma } from '@becker/db';

interface AdminNotifyConfig {
  evolutionUrl: string;
  evolutionKey: string;
  evolutionInstance: string;
  adminNumber: string;
}

/**
 * Normaliza número WhatsApp pro formato Evolution API (sem o 9)
 * Entrada: 55819999441333 (com 9) ou 5581999441333 (sem 9) ou (81) 99944-1333
 * Saída: 5581999441333 (formato aceito pela API)
 */
function normalizeEvolutionNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  // Se tem 13 dígitos (55 + 11 com DDD+9), tira o 9
  // 55 81 9 9944-1333 = 55 81 9 999441333 = 13 dígitos
  if (digits.length === 13 && digits.startsWith('55')) {
    // 55 + DDD(2) + 9 + 9 dígitos = 13
    // 55 81 9 999441333 -> tira o 9 -> 55 81 999441333 = 12
    return digits.slice(0, 4) + digits.slice(5);
  }
  // Se tem 12 dígitos já tá certo (55 + DDD + 9 dígitos sem o 9)
  // Se tem 11 dígitos é só DDD+número (sem 55), adiciona 55
  if (digits.length === 11) {
    return '55' + digits;
  }
  return digits;
}

/**
 * Busca config do DB, com fallback pras env vars
 */
async function getAdminNotifyConfig(): Promise<AdminNotifyConfig | null> {
  try {
    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            'integrations_evolution_url',
            'integrations_evolution_api_key',
            'integrations_evolution_instance',
            'integrations_admin_whatsapp',
          ],
        },
      },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;

    // Fallback pra env vars (sempre presente na VPS)
    const url = map.integrations_evolution_url || process.env.EVOLUTION_API_URL || '';
    const key = map.integrations_evolution_api_key || process.env.EVOLUTION_API_KEY || '';
    const instance = map.integrations_evolution_instance || process.env.EVOLUTION_INSTANCE || '';
    const numberRaw = map.integrations_admin_whatsapp || process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '';

    if (!url || !key || !instance || !numberRaw) {
      console.log('[admin-notify] Config incompleta:', {
        hasUrl: !!url, hasKey: !!key, hasInstance: !!instance, hasNumber: !!numberRaw,
      });
      return null;
    }

    const number = normalizeEvolutionNumber(numberRaw);

    return { evolutionUrl: url, evolutionKey: key, evolutionInstance: instance, adminNumber: number };
  } catch (e) {
    console.error('[admin-notify] Erro ao buscar config:', e);
    return null;
  }
}

/**
 * Envia mensagem WhatsApp pro admin via Evolution API
 */
export async function notifyAdmin(text: string): Promise<{ ok: boolean; error?: string }> {
  const config = await getAdminNotifyConfig();
  if (!config) {
    return { ok: false, error: 'Configuração incompleta (URL/Key/Instance/Number)' };
  }

  try {
    const phoneDigits = config.adminNumber; // já tá normalizado
    const url = `${config.evolutionUrl}/message/sendText/${config.evolutionInstance}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.evolutionKey,
      },
      body: JSON.stringify({
        number: phoneDigits,
        text: text.substring(0, 4096),
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error('[admin-notify] Evolution erro:', res.status, body);
      return { ok: false, error: body.message || body.error || `HTTP ${res.status}` };
    }

    return { ok: true };
  } catch (e: any) {
    console.error('[admin-notify] Exceção:', e);
    return { ok: false, error: e.message };
  }
}

// ============ TEMPLATES DE NOTIFICAÇÃO ADMIN ============

export const adminTemplates = {
  newOrder: (order: { number: string; customerName: string; customerPhone: string; total: number; items: Array<{ qty: number; productName: string; versionLabel: string }>; address?: { street: string; number: string; neighborhood: string; city: string; state: string }; paymentMethod: string }) => {
    const items = order.items
      .map((i) => `  • ${i.qty}x ${i.productName} ${i.versionLabel}`)
      .join('\n');

    const addr = order.address
      ? `\n📍 *Entrega:* ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}, ${order.address.city}/${order.address.state}`
      : '';

    return `🛒 *NOVO PEDIDO!* ${order.number}

👤 *Cliente:* ${order.customerName}
📱 *WhatsApp:* ${order.customerPhone}

📦 *Itens:*
${items}

💰 *Total:* R$ ${order.total.toFixed(2)}
💳 *Pagamento:* ${order.paymentMethod.toUpperCase()}${addr}

🔗 Acesse: https://becker.pscode.ia.br/admin/pedidos`;
  },

  paymentApproved: (order: { number: string; customerName: string; total: number }) => {
    return `💰 *PAGAMENTO CONFIRMADO!*

Pedido: *${order.number}*
Cliente: ${order.customerName}
Valor: R$ ${order.total.toFixed(2)}

Status: *Em separação* 📦

🔗 https://becker.pscode.ia.br/admin/pedidos`;
  },

  orderShipped: (order: { number: string; customerName: string; tracking: string }) => {
    return `🚚 *PEDIDO ENVIADO!*

Pedido: *${order.number}*
Cliente: ${order.customerName}
Rastreio: ${order.tracking}

🔗 https://becker.pscode.ia.br/admin/pedidos`;
  },

  orderDelivered: (order: { number: string; customerName: string }) => {
    return `✅ *PEDIDO ENTREGUE!*

Pedido: *${order.number}*
Cliente: ${order.customerName} 🎉`;
  },

  orderCancelled: (order: { number: string; customerName: string; reason?: string }) => {
    return `❌ *PEDIDO CANCELADO*

Pedido: *${order.number}*
Cliente: ${order.customerName}${order.reason ? `\nMotivo: ${order.reason}` : ''}`;
  },

  newLead: (lead: { name: string; whatsapp: string; source: string }) => {
    return `🎯 *NOVO LEAD!*

👤 *Nome:* ${lead.name}
📱 *WhatsApp:* ${lead.whatsapp}
📍 *Origem:* ${lead.source}

Cliente digitou WhatsApp no checkout mas não finalizou compra.
Chame agora pra converter! 📞`;
  },

  dailySummary: (stats: { orders: number; revenue: number; leads: number; cancelled: number }) => {
    return `📊 *RESUMO DIÁRIO BECKER*

🛒 Pedidos hoje: ${stats.orders}
💰 Receita: R$ ${stats.revenue.toFixed(2)}
🎯 Leads capturados: ${stats.leads}
❌ Cancelados: ${stats.cancelled}

🔗 https://becker.pscode.ia.br/admin`;
  },
};
