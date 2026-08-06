// ============================================================
// API: Auto-fix Telegram chat_id
// POST /api/telegram/fix
//
// Detecta e corrige automaticamente o chat_id problemático.
// 1. Se chat_id == bot_id, apaga (força re-setup)
// 2. Se chat_id não bate com nenhum update real, valida manualmente
// 3. Tenta enviar mensagem — se falhar, retorna erro detalhado
//
// Chamado pelo Admin Config ou pelo usuário se notificações pararam
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function POST(req: NextRequest) {
  try {
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_bot_token' },
    });
    const chatIdSetting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_chat_id' },
    });

    if (!tokenSetting?.value) {
      return NextResponse.json({ ok: false, error: 'Bot token não configurado' }, { status: 400 });
    }

    const token = tokenSetting.value;
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const me = await meRes.json();
    const botId = me.result?.id ? String(me.result.id) : null;
    const botUsername = me.result?.username;

    const currentChatId = chatIdSetting?.value;
    const issues: string[] = [];
    const fixes: string[] = [];

    // PROBLEMA 1: chat_id é o ID do bot
    if (currentChatId && botId && currentChatId === botId) {
      issues.push(`chat_id (${currentChatId}) é o ID do próprio bot — Telegram recusa envio`);
      // Apaga
      await prisma.setting.delete({
        where: { key: 'integrations_telegram_chat_id' },
      }).catch(() => {});
      fixes.push('chat_id inválido removido (era o ID do bot)');
    }

    // PROBLEMA 2: chat_id não bate com nenhum update
    if (currentChatId && currentChatId !== botId) {
      const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
      const updates = await updatesRes.json();

      const allChatIds = new Set<string>();
      if (updates.result) {
        for (const u of updates.result) {
          const m = u.message || u.edited_message;
          if (m?.chat?.id) allChatIds.add(String(m.chat.id));
        }
      }

      if (allChatIds.size > 0 && !allChatIds.has(currentChatId)) {
        issues.push(`chat_id (${currentChatId}) não corresponde a nenhum usuário que mandou mensagem pro bot`);
        issues.push(`Usuários conhecidos: ${[...allChatIds].join(', ')}`);

        // Tenta enviar mesmo assim pra confirmar
        const sendRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: currentChatId,
            text: '🧪 Teste de diagnóstico Becker',
          }),
        });
        const sendData = await sendRes.json();

        if (!sendData.ok) {
          // Apaga o chat_id inválido
          await prisma.setting.delete({
            where: { key: 'integrations_telegram_chat_id' },
          }).catch(() => {});
          fixes.push(`chat_id inválido removido (Telegram recusou: "${sendData.description}")`);
        } else {
          fixes.push(`chat_id testado com sucesso — Telegram respondeu OK`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      bot: botId ? { id: botId, username: botUsername } : null,
      currentChatId: currentChatId && currentChatId !== botId ? currentChatId : null,
      issues,
      fixes,
      action_required: issues.length > 0
        ? 'Siga os passos: 1) Abra Telegram, 2) Procure @' + botUsername + ', 3) Mande "oi", 4) Volte no Admin Config e clique "Detectar"'
        : null,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
