// ============================================================
// Telegram Webhook - recebe mensagens e responde com Q&A sobre DB
// Sprint 8: equipe interna pode perguntar "quantos pedidos hoje?"
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { sendTelegram, telegramTemplates } from '@/lib/telegram';
import { formatPrice } from '@/lib/utils';

// Whitelist de Telegram IDs permitidos (segurança)
let ALLOWED_CHAT_IDS: string[] = [];

// Carrega do banco na inicialização
async function loadAllowedIds() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_chat_id' },
    });
    if (setting?.value) {
      ALLOWED_CHAT_IDS = [setting.value];
    }
  } catch (e) {
    console.error('[telegram/webhook] Erro ao carregar config:', e);
  }
}
loadAllowedIds();

/**
 * Processa uma mensagem e gera resposta
 */
async function processQuery(text: string): Promise<string> {
  const query = text.toLowerCase().trim();

  // Comandos rápidos
  if (query.includes('hoje') && (query.includes('pedido') || query.includes('venda'))) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [count, sum] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: start } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: start }, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        select: { total: true },
      }),
    ]);
    const total = sum.reduce((s, o) => s + Number(o.total), 0);
    return `📊 *Pedidos hoje*\n\n` +
           `🛒 Total: ${count}\n` +
           `💰 Receita: ${formatPrice(total)}\n` +
           `✅ Pagos: ${sum.length}`;
  }

  if (query.includes('mês') && (query.includes('pedido') || query.includes('venda'))) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const [count, sum] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: start } } }),
      prisma.order.findMany({
        where: { createdAt: { gte: start }, status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] } },
        select: { total: true },
      }),
    ]);
    const total = sum.reduce((s, o) => s + Number(o.total), 0);
    return `📊 *Pedidos no mês*\n\n` +
           `🛒 Total: ${count}\n` +
           `💰 Receita: ${formatPrice(total)}\n` +
           `✅ Pagos: ${sum.length}`;
  }

  if (query.includes('lead') || query.includes('carrinho abandonado')) {
    const customers = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: { orders: { select: { id: true, status: true } } },
    });
    const leads = customers.filter((c) =>
      !c.orders.some((o) => ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(o.status))
    );
    return `🎯 *Leads (sem compra)*\n\n` +
           `👥 ${leads.length} leads\n\n` +
           `Acesse /admin/leads para ver e contatar.`;
  }

  if (query.includes('estoque') || query.includes('stock')) {
    const versions = await prisma.productVersion.findMany({
      where: { stock: { lt: 50 } },
      include: { product: { select: { name: true, slug: true } } },
      take: 10,
      orderBy: { stock: 'asc' },
    });
    if (versions.length === 0) return '✅ Todos os produtos com estoque acima de 50 unidades.';
    return `⚠️ *Estoque baixo*\n\n` +
           versions.map((v) => `  • ${v.product.name} (${v.label}): ${v.stock}`).join('\n');
  }

  if (query.includes('produto') && (query.includes('mais') || query.includes('top'))) {
    const products = await prisma.product.findMany({
      orderBy: { reviewCount: 'desc' },
      take: 5,
      select: { name: true, rating: true, reviewCount: true },
    });
    return `⭐ *Top 5 produtos (por avaliação)*\n\n` +
           products.map((p, i) => `  ${i + 1}. ${p.name} (${p.rating}★, ${p.reviewCount} reviews)`).join('\n');
  }

  if (query.includes('cliente') || query.includes('usuário')) {
    const total = await prisma.user.count();
    const admins = await prisma.user.count({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } } });
    return `👥 *Usuários*\n\n` +
           `Total: ${total}\n` +
           `Admins: ${admins}\n` +
           `Clientes: ${total - admins}`;
  }

  if (query === 'ajuda' || query === '/start' || query === 'help' || query === '?') {
    return `🤖 *Comandos disponíveis:*\n\n` +
           `• "pedidos hoje" / "vendas hoje"\n` +
           `• "pedidos mês" / "vendas mês"\n` +
           `• "leads" / "carrinhos abandonados"\n` +
           `• "estoque baixo"\n` +
           `• "produtos top"\n` +
           `• "usuários" / "clientes"\n` +
           `• "ajuda" pra ver essa lista\n\n` +
           `💬 Pode mandar pergunta livre também!`;
  }

  // Q&A livre: tenta dar uma resposta útil baseada no contexto
  return `🤖 Entendi "${text}", mas não tenho um comando específico pra isso.\n\n` +
         `Pergunte algo como:\n` +
         `• "pedidos hoje"\n` +
         `• "leads"\n` +
         `• "estoque baixo"\n` +
         `• "produtos top"\n` +
         `Ou digite "ajuda" pra ver todos.`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = body?.message;
    if (!message?.text) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text;
    const fromName = message.from?.first_name || 'colega';

    // Segurança: só responde pra chat_id autorizado
    if (ALLOWED_CHAT_IDS.length > 0 && !ALLOWED_CHAT_IDS.includes(chatId) && !ALLOWED_CHAT_IDS.includes('@' + (message.from?.username || ''))) {
      console.log(`[telegram/webhook] Ignorando chat_id não autorizado: ${chatId}`);
      return NextResponse.json({ ok: true, ignored: 'unauthorized' });
    }

    console.log(`[telegram/webhook] ${fromName}: ${text}`);

    const answer = await processQuery(text);
    await sendTelegram(`Oi ${fromName}! 👋\n\n${answer}`);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[telegram/webhook] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// Webhook setup (chamado uma vez)
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Telegram webhook endpoint',
    usage: 'Configure o webhook da Evolution API ou do seu Telegram bot para apontar aqui',
  });
}
