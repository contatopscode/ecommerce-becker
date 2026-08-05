// ============================================================
// API: Auto-detectar chat_id
// GET /api/telegram/setup
// Quando alguém acessa essa URL, lê os updates do bot
// e salva o chat_id do primeiro usuário que mandou mensagem
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function GET(req: NextRequest) {
  try {
    // Pega token
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_bot_token' },
    });
    if (!tokenSetting?.value) {
      return NextResponse.json({ ok: false, error: 'Bot token não configurado' }, { status: 400 });
    }

    // Busca updates (mensagens recebidas pelo bot)
    const res = await fetch(`https://api.telegram.org/bot${tokenSetting.value}/getUpdates?limit=10`);
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json({ ok: false, error: data.description || 'Erro ao buscar updates' }, { status: 500 });
    }

    if (data.result.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'Nenhuma mensagem recebida ainda',
        hint: 'Mande "oi" pro bot no Telegram primeiro',
      });
    }

    // Pega o chat_id do primeiro update
    const firstUpdate = data.result[0];
    const chatId = String(firstUpdate.message?.chat?.id || firstUpdate.edited_message?.chat?.id);
    const fromName = firstUpdate.message?.from?.first_name || 'usuário';
    const fromUsername = firstUpdate.message?.from?.username;

    if (!chatId) {
      return NextResponse.json({ ok: false, error: 'Update sem chat_id' }, { status: 500 });
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

    return NextResponse.json({
      ok: true,
      chatId,
      fromName,
      fromUsername,
      message: `Chat ID de ${fromName} (${fromUsername || 'sem username'}) salvo!`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
