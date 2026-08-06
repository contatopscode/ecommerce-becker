// ============================================================
// API: Testar um token Telegram
// POST /api/telegram/test-token
// Body: { token: string }
//
// Retorna info do bot + tenta enviar msg de teste pro chat_id configurado
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || !token.includes(':')) {
      return NextResponse.json({
        ok: false,
        error: 'Token inválido. Formato esperado: 123456:ABC-DEF...',
      }, { status: 400 });
    }

    // getMe
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const me = await meRes.json();

    if (!me.ok) {
      return NextResponse.json({
        ok: false,
        error: me.description || 'Token inválido ou expirado',
        hint: 'Vá em @BotFather → /mybots → escolha o bot → API Token',
      }, { status: 400 });
    }

    // getUpdates
    const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
    const updates = await updatesRes.json();

    // Lista candidatos (chat_ids de usuários)
    const candidates: Array<{ chat_id: string; from: string; text: string }> = [];
    const botId = String(me.result.id);
    if (updates.result) {
      for (const u of updates.result) {
        const m = u.message || u.edited_message;
        if (!m) continue;
        const cid = String(m.chat?.id);
        if (cid === botId) continue;
        if (m.from?.is_bot) continue;
        candidates.push({
          chat_id: cid,
          from: m.from?.first_name || 'Usuário',
          text: m.text || '',
        });
      }
    }

    return NextResponse.json({
      ok: true,
      bot: {
        id: botId,
        username: me.result.username,
        first_name: me.result.first_name,
        link: `https://t.me/${me.result.username}`,
      },
      candidates,
      has_user_messages: candidates.length > 0,
      message: candidates.length > 0
        ? `✅ Bot @${me.result.username} ativo. ${candidates.length} mensagem(ns) de usuário recebida(s).`
        : `⚠️ Bot @${me.result.username} ativo, mas ainda sem mensagens de usuário. Mande "oi" pra ele primeiro.`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
