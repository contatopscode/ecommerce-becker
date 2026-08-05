// ============================================================
// Telegram Bot - Sprint 8
// Notificações para equipe interna + Q&A sobre o DB
// ============================================================

import { prisma } from '@becker/db';

interface TelegramConfig {
  botToken: string;
  chatId: string;
}

async function getConfig(): Promise<TelegramConfig | null> {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['integrations_telegram_bot_token', 'integrations_telegram_chat_id'] } },
    });
    const map: Record<string, string> = {};
    for (const s of settings) map[s.key] = s.value;
    if (!map.integrations_telegram_bot_token || !map.integrations_telegram_chat_id) return null;
    return {
      botToken: map.integrations_telegram_bot_token,
      chatId: map.integrations_telegram_chat_id,
    };
  } catch {
    return null;
  }
}

/**
 * Envia mensagem para o Telegram
 */
export async function sendTelegram(text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<{ ok: boolean; error?: string }> {
  const config = await getConfig();
  if (!config) {
    console.log('[telegram] Não configurado, pulando');
    return { ok: false, error: 'Não configurado' };
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: text.substring(0, 4096), // limite do Telegram
        parse_mode: parseMode,
        disable_web_page_preview: true,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error('[telegram] Erro:', data);
      return { ok: false, error: data.description };
    }

    return { ok: true };
  } catch (e: any) {
    console.error('[telegram] Exceção:', e);
    return { ok: false, error: e.message };
  }
}

// ============ TEMPLATES DE NOTIFICAÇÃO ============

export const telegramTemplates = {
  newOrder: (order: { number: string; customerName: string; total: number; itemCount: number; items?: string }) => {
    return `🛒 *Novo pedido!* ${order.number}

👤 ${order.customerName}
💰 R$ ${order.total.toFixed(2)}
📦 ${order.itemCount} ${order.itemCount === 1 ? 'item' : 'itens'}
${order.items ? `\n${order.items}` : ''}

Acesse o admin para gerenciar.`;
  },

  newLead: (lead: { name: string; whatsapp: string }) => {
    return `🎯 *Novo lead!*

👤 ${lead.name}
📱 ${lead.whatsapp}

Cliente digitou WhatsApp no checkout mas não finalizou compra.
Chame agora pra converter!`;
  },

  paymentApproved: (order: { number: string; customerName: string; total: number }) => {
    return `💰 *Pagamento confirmado!*

Pedido *${order.number}*
👤 ${order.customerName}
💰 R$ ${order.total.toFixed(2)}

Status atualizado para *Em separação*.`;
  },

  orderShipped: (order: { number: string; customerName: string; tracking: string }) => {
    return `🚚 *Pedido enviado!*

Pedido *${order.number}* — ${order.customerName}
Rastreio: ${order.tracking}`;
  },

  orderDelivered: (order: { number: string; customerName: string }) => {
    return `✅ *Pedido entregue!*

Pedido *${order.number}* — ${order.customerName} 🎉`;
  },

  orderCancelled: (order: { number: string; customerName: string }) => {
    return `❌ *Pedido cancelado*

Pedido *${order.number}* — ${order.customerName}`;
  },

  dailySummary: (stats: { orders: number; revenue: number; leads: number; cancelled: number }) => {
    return `📊 *Resumo Diário Becker*

🛒 Pedidos hoje: ${stats.orders}
💰 Receita: R$ ${stats.revenue.toFixed(2)}
🎯 Leads capturados: ${stats.leads}
❌ Cancelados: ${stats.cancelled}

Acesse /admin para detalhes.`;
  },

  helpResponse: (query: string, answer: string) => {
    return `🤖 *Q&A Becker*

❓ ${query}

💡 ${answer}`;
  },
};
