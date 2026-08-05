// ============================================================
// API: Diagnóstico Telegram
// GET /api/telegram/diagnose
// Retorna info sobre o bot + tenta achar chat_id em vários lugares
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function GET(req: NextRequest) {
  try {
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_bot_token' },
    });
    if (!tokenSetting?.value) {
      return NextResponse.json({ ok: false, error: 'Bot token não configurado' }, { status: 400 });
    }

    const token = tokenSetting.value;
    const baseUrl = `https://api.telegram.org/bot${token}`;

    // Coleta várias informações
    const [meRes, updatesRes, webhookRes] = await Promise.all([
      fetch(`${baseUrl}/getMe`),
      fetch(`${baseUrl}/getUpdates?limit=100&allowed_updates=["message","channel_post"]`),
      fetch(`${baseUrl}/getWebhookInfo`),
    ]);

    const [me, updates, webhook] = await Promise.all([
      meRes.json(),
      updatesRes.json(),
      webhookRes.json(),
    ]);

    return NextResponse.json({
      ok: true,
      bot: me.result ? {
        id: me.result.id,
        username: me.result.username,
        first_name: me.result.first_name,
        can_join_groups: me.result.can_join_groups,
        can_read_all_group_messages: me.result.can_read_all_group_messages,
      } : null,
      updates_count: updates.result?.length || 0,
      updates: updates.result?.slice(0, 3) || [],
      webhook: webhook.result || null,
      hints: [
        updates.result?.length === 0
          ? '❌ Nenhuma mensagem recebida. Verifique:'
          : '✅ Mensagens encontradas!',
        '1. O bot existe? Username: ' + (me.result?.username || 'NÃO ENCONTRADO'),
        '2. Você mandou /start ou qualquer mensagem pro bot no Telegram?',
        '3. O bot aceita mensagens de陌生人? (privacy settings)',
        '4. Você bloqueou o bot por engano?',
        '5. Tente acessar o bot via link: t.me/' + (me.result?.username || 'BOT_USERNAME'),
      ],
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
