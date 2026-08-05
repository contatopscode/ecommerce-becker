// ============================================================
// API: Setup Telegram (auto-detecta OU configura manualmente)
// POST /api/telegram/setup
// Body: { manualChatId?: string, testAfter?: boolean }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { sendTelegram } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { manualChatId, testAfter } = body;

    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_bot_token' },
    });
    if (!tokenSetting?.value) {
      return NextResponse.json({ ok: false, error: 'Bot token não configurado' }, { status: 400 });
    }

    let chatId = manualChatId;
    let detected = false;
    let fromName = null;

    // Se não veio manual, tenta auto-detectar
    if (!chatId) {
      const res = await fetch(`https://api.telegram.org/bot${tokenSetting.value}/getUpdates?limit=10`);
      const data = await res.json();

      if (data.ok && data.result && data.result.length > 0) {
        const firstUpdate = data.result[0];
        chatId = String(firstUpdate.message?.chat?.id || firstUpdate.edited_message?.chat?.id);
        fromName = firstUpdate.message?.from?.first_name;
        detected = true;
      } else {
        return NextResponse.json({
          ok: false,
          error: 'Nenhuma mensagem encontrada',
          hint: 'Mande "oi" pro bot @MinimaxPaulo_bot no Telegram primeiro',
          steps: [
            '1. Abra o Telegram',
            '2. Procure por: @MinimaxPaulo_bot',
            '3. Mande qualquer mensagem (ex: "oi")',
            '4. Volte aqui e clique em "Detectar" de novo',
            'OU digite seu chat_id manualmente abaixo',
          ],
        });
      }
    }

    if (!chatId || !/^-?\d+$/.test(chatId)) {
      return NextResponse.json({ ok: false, error: 'Chat ID inválido (deve ser numérico, ex: 123456789)' }, { status: 400 });
    }

    // Salva no DB
    await prisma.setting.upsert({
      where: { key: 'integrations_telegram_chat_id' },
      update: { value: chatId },
      create: {
        key: 'integrations_telegram_chat_id',
        value: chatId,
        category: 'integrations',
        label: 'Telegram Chat ID (equipe)',
        type: 'text',
      },
    });

    // Envia mensagem de teste
    let testSent = false;
    if (testAfter !== false) {
      const result = await sendTelegram(
        `✅ *Becker conectado ao Telegram!*\n\n` +
        `Chat ID: \`${chatId}\`\n` +
        (fromName ? `Nome: ${fromName}\n` : '') +
        `\nDaqui pra frente você vai receber:\n` +
        `• 🛒 Novos pedidos\n` +
        `• 💰 Pagamentos confirmados\n` +
        `• 🚚 Envios\n` +
        `• 🎯 Leads capturados\n\n` +
        `Mande "ajuda" pra ver comandos do Q&A bot.`
      );
      testSent = result.ok;
    }

    return NextResponse.json({
      ok: true,
      chatId,
      detected,
      fromName,
      testSent,
      message: detected
        ? `Chat ID de ${fromName} detectado e salvo! Mensagem de teste enviada.`
        : `Chat ID ${chatId} salvo manualmente! ${testSent ? 'Mensagem de teste enviada.' : ''}`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// GET: apenas diagnostica
export async function GET() {
  try {
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_bot_token' },
    });
    if (!tokenSetting?.value) {
      return NextResponse.json({ ok: false, error: 'Bot token não configurado' }, { status: 400 });
    }

    const res = await fetch(`https://api.telegram.org/bot${tokenSetting.value}/getUpdates?limit=10`);
    const data = await res.json();

    return NextResponse.json({
      ok: true,
      hasMessages: data.result?.length > 0,
      count: data.result?.length || 0,
      messages: data.result?.slice(0, 3) || [],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
