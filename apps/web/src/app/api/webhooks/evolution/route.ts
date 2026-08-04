// ============================================================
// Webhook Evolution API
// Recebe mensagens do WhatsApp e processa com agente IA
// POST /api/webhooks/evolution
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { sendWhatsApp, normalizeWhatsAppNumber } from '@/lib/whatsapp-client';
import { chat, detectIntent } from '@/lib/ai-server';

const WEBHOOK_TOKEN = process.env.EVOLUTION_WEBHOOK_TOKEN || 'becker-secret-token';

interface EvolutionMessage {
  event: string;
  instance: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    pushName?: string;
    message?: {
      conversation?: string;
      extendedTextMessage?: { text: string };
    };
    messageType: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Validar token (se configurado)
    const auth = req.headers.get('authorization');
    if (auth && auth !== `Bearer ${WEBHOOK_TOKEN}` && auth !== WEBHOOK_TOKEN) {
      // Evolution API v2 envia o apikey no header apikey, mas pode usar bearer também
      const apikey = req.headers.get('apikey');
      if (apikey && apikey !== WEBHOOK_TOKEN && apikey !== process.env.EVOLUTION_API_KEY) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
    }

    const payload: EvolutionMessage = await req.json();

    // Só processar mensagens recebidas (não as enviadas por nós)
    if (payload.data?.key?.fromMe) {
      return NextResponse.json({ ok: true, skipped: 'fromMe' });
    }

    if (payload.event !== 'messages.upsert' && payload.event !== 'MESSAGES_UPSERT') {
      return NextResponse.json({ ok: true, skipped: 'event' });
    }

    // Extrair texto
    const text =
      payload.data.message?.conversation ||
      payload.data.message?.extendedTextMessage?.text ||
      '';

    if (!text) {
      return NextResponse.json({ ok: true, skipped: 'no-text' });
    }

    const phone = payload.data.key.remoteJid
      .replace('@s.whatsapp.net', '')
      .replace('@g.us', '');
    const customerName = payload.data.pushName || undefined;

    console.log(`[whatsapp] Mensagem de ${phone}: ${text}`);

    // Processar em background
    processMessage(phone, customerName, text, payload.data.key.id).catch((e) =>
      console.error('[whatsapp] Erro:', e)
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[webhook] Erro:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'evolution-webhook',
    timestamp: new Date().toISOString(),
  });
}

async function processMessage(phone: string, customerName: string | undefined, text: string, messageId: string) {
  // 1. Salvar mensagem no DB
  const conversation = await prisma.whatsAppConversation.upsert({
    where: { id: `wa_${phone}` },
    update: {
      lastMessageAt: new Date(),
      customerName: customerName || undefined,
    },
    create: {
      id: `wa_${phone}`,
      phone,
      customerName,
      messages: [],
      lastMessageAt: new Date(),
    },
  });

  // Append message
  const messages = Array.isArray(conversation.messages) ? conversation.messages as any[] : [];
  messages.push({ role: 'user', content: text, at: new Date().toISOString() });

  // 2. Detectar intenção
  const intent = await detectIntent(text);

  // 3. Comandos rápidos (sem IA)
  let responseText: string | null = null;

  // Comando: STATUS {numero}
  if (text.toLowerCase().startsWith('status ') || intent === 'status') {
    const match = text.match(/BKR-\d+-\w+/i);
    const orderNumber = match ? match[0] : null;

    if (orderNumber) {
      const order = await prisma.order.findUnique({
        where: { number: orderNumber.toUpperCase() },
        include: { items: true, address: true },
      });
      if (order) {
        const statusText = {
          PENDING: 'Aguardando pagamento',
          PAID: 'Pago, em preparação',
          PROCESSING: 'Em separação',
          SHIPPED: 'Enviado',
          DELIVERED: 'Entregue',
          CANCELLED: 'Cancelado',
          REFUNDED: 'Reembolsado',
        }[order.status] || order.status;

        responseText = `📦 *Pedido ${order.number}*\n\n` +
          `Status: *${statusText}*\n` +
          `Total: R$ ${Number(order.total).toFixed(2)}\n` +
          (order.tracking ? `Rastreio: ${order.tracking}\n` : '') +
          `\nItens:\n` +
          order.items.map((i) => `  • ${i.qty}x ${i.productName} (${i.versionLabel})`).join('\n');
      } else {
        responseText = `❌ Pedido *${orderNumber}* não encontrado. Verifica o número e tenta de novo.`;
      }
    } else {
      // Buscar últimos pedidos do telefone
      const orders = await prisma.order.findMany({
        where: {
          OR: [
            { user: { whatsapp: phone } },
            { guestWhatsapp: phone },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { items: true },
      });
      if (orders.length === 0) {
        responseText = `📦 Você ainda não tem pedidos. Quer conhecer nossos produtos? Acesse https://becker.pscode.ia.br`;
      } else {
        responseText = `📦 *Seus últimos pedidos:*\n\n` +
          orders.map((o) => {
            const s: Record<string, string> = { PENDING: 'Aguardando pgto', PAID: 'Pago', PROCESSING: 'Em separação', SHIPPED: 'Enviado', DELIVERED: 'Entregue' };
            return `• *${o.number}* — R$ ${Number(o.total).toFixed(2)} — ${s[o.status] || o.status}`;
          }).join('\n') +
          `\n\nQuer detalhes de algum? Manda o número do pedido.`;
      }
    }
  }

  // Comando: HUMANO
  else if (intent === 'humano' || text.toLowerCase().match(/atendente|humano|pessoa|atendimento humano/)) {
    responseText = `👩‍💼 Perfeito! Vou te transferir para um atendente humano agora.\n\nEm horário comercial, o tempo médio de resposta é de 5 minutos. Pode descrever sua dúvida que já anoto aqui!`;
  }

  // Comando: CARDÁPIO / PRODUTOS
  else if (text.toLowerCase().match(/^(cardápio|cardapio|catálogo|catalogo|produtos|menu|oi|olá|ola|bom dia|boa tarde|boa noite|hi|hello)$/i)) {
    const top = await prisma.product.findMany({
      where: { isTop: true, active: true },
      take: 5,
      include: { versions: { where: { active: true }, take: 1, orderBy: { price: 'asc' } } },
    });
    responseText = `👋 Olá! Sou o assistente virtual da Becker 💜\n\n` +
      `Temos 21 produtos disponíveis. Aqui estão os *top da semana*:\n\n` +
      top.map((p, i) => {
        const price = p.versions[0] ? Number(p.versions[0].price).toFixed(2) : '0';
        return `${i + 1}. *${p.name}* — R$ ${price}\n   https://becker.pscode.ia.br/produto/${p.slug}`;
      }).join('\n\n') +
      `\n\nQuer comprar? Manda o nome do produto que eu te ajudo!`;
  }

  // 4. Caso não reconhecido pelos atalhos: usa IA
  if (!responseText) {
    const aiResult = await chat(text, messages.slice(-10));
    if (aiResult.success && aiResult.response) {
      responseText = aiResult.response;
    } else {
      // Fallback
      responseText = `Desculpa, tive um problema técnico. 😅\n\n` +
        `Posso te ajudar com:\n` +
        `• 🛒 *Fazer pedido* (manda "comprar" + nome do produto)\n` +
        `• 📦 *Status* (manda "status BKR-XXXXX")\n` +
        `• 👩‍💼 *Atendente humano* (digite "humano")\n\n` +
        `Ou acesse: https://becker.pscode.ia.br`;
    }
  }

  // 5. Enviar resposta
  if (responseText) {
    try {
      await sendWhatsApp({ number: phone, text: responseText });
      messages.push({ role: 'assistant', content: responseText, at: new Date().toISOString() });
    } catch (e) {
      console.error('Erro ao enviar resposta:', e);
    }
  }

  // 6. Salvar conversa atualizada
  await prisma.whatsAppConversation.update({
    where: { id: `wa_${phone}` },
    data: {
      messages: messages as any,
      context: { lastIntent: intent, lastMessageId: messageId } as any,
    },
  });
}
