// ============================================================
// API: Setup Telegram (auto-detecta OU configura manualmente)
// POST /api/telegram/setup
// Body: { manualChatId?: string, testAfter?: boolean }
//
// Valida SEMPRE que o chat_id é diferente do bot_id.
// Se for igual, rejeita (Telegram: "bot can't send messages to the bot").
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

    const token = tokenSetting.value;

    // Pega info do bot pra comparar
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const me = await meRes.json();
    const botId = me.result?.id ? String(me.result.id) : null;

    let chatId = manualChatId;
    let detected = false;
    let fromName = null;
    let candidates: Array<{chatId: string, from: string, text: string}> = [];

    // Se não veio manual, tenta auto-detectar
    if (!chatId) {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20`);
      const data = await res.json();

      if (data.ok && data.result && data.result.length > 0) {
        // Pega TODOS os updates de usuários (não do bot)
        for (const update of data.result) {
          const msg = update.message || update.edited_message;
          if (!msg) continue;
          const cid = String(msg.chat?.id);
          const fname = msg.from?.first_name || 'Usuário';
          const txt = msg.text || '';
          // Ignora updates do próprio bot
          if (cid === botId) continue;
          candidates.push({ chatId: cid, from: fname, text: txt });
        }

        if (candidates.length > 0) {
          // Pega o mais recente
          const last = candidates[candidates.length - 1];
          chatId = last.chatId;
          fromName = last.from;
          detected = true;
        } else {
          return NextResponse.json({
            ok: false,
            error: 'Nenhuma mensagem de usuário encontrada (só tem mensagem do próprio bot)',
            hint: 'Mande "oi" pro bot @MinimaxPaulo_bot no Telegram primeiro',
            steps: [
              '1. Abra o Telegram no celular',
              '2. Procure por: @MinimaxPaulo_bot',
              '3. IMPORTANTE: clique em "START" ou mande qualquer mensagem',
              '4. Volte aqui e clique em "Detectar" de novo',
              'OU digite seu chat_id manualmente abaixo',
            ],
          });
        }
      } else {
        return NextResponse.json({
          ok: false,
          error: 'Nenhuma mensagem recebida pelo bot',
          hint: 'Mande "oi" pro bot @MinimaxPaulo_bot no Telegram primeiro',
          steps: [
            '1. Abra o Telegram',
            '2. Procure por: @MinimaxPaulo_bot',
            '3. Manda qualquer mensagem (ex: "oi")',
            '4. Clica em "Detectar" de novo',
            'OU digite seu chat_id manualmente abaixo',
          ],
        });
      }
    }

    if (!chatId || !/^-?\d+$/.test(chatId)) {
      return NextResponse.json({
        ok: false,
        error: 'Chat ID inválido (deve ser só números, ex: 123456789)',
      }, { status: 400 });
    }

    // VALIDAÇÃO CRÍTICA: chat_id não pode ser o ID do bot
    if (chatId === botId) {
      return NextResponse.json({
        ok: false,
        error: `❌ O chat_id (${chatId}) é o ID do próprio bot! Telegram não permite isso.`,
        hint: 'Você precisa do ID de um USUÁRIO (não do bot)',
        steps: [
          '1. Abra o Telegram',
          '2. Procure por: @userinfobot (ou @getidsbot)',
          '3. Manda /start',
          '4. Ele te dá teu ID de usuário (começa com 1, 5, 6, etc)',
          '5. Cola aqui',
        ],
        detected_bot_id: botId,
      }, { status: 400 });
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
    let testError: string | null = null;
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
      if (!result.ok) testError = result.error;
    }

    return NextResponse.json({
      ok: true,
      chatId,
      detected,
      fromName,
      testSent,
      testError,
      message: detected
        ? `Chat ID de ${fromName} detectado e salvo! ${testSent ? 'Mensagem de teste enviada ✓' : '⚠️ Mas erro ao enviar teste: ' + testError}`
        : `Chat ID ${chatId} salvo! ${testSent ? 'Mensagem de teste enviada ✓' : '⚠️ Mas erro ao enviar teste: ' + testError}`,
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

    const [meRes, updatesRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${tokenSetting.value}/getMe`),
      fetch(`https://api.telegram.org/bot${tokenSetting.value}/getUpdates?limit=20`),
    ]);
    const [me, updates] = await Promise.all([meRes.json(), updatesRes.json()]);

    const botId = me.result?.id ? String(me.result.id) : null;
    const messages = (updates.result || [])
      .map((u: any) => u.message || u.edited_message)
      .filter(Boolean)
      .map((m: any) => ({
        chat_id: String(m.chat?.id),
        from: m.from?.first_name,
        is_bot: m.from?.is_bot,
        text: m.text,
        date: m.date,
      }));

    return NextResponse.json({
      ok: true,
      bot: me.result ? {
        id: String(me.result.id),
        username: me.result.username,
        first_name: me.result.first_name,
      } : null,
      bot_id: botId,
      has_messages: messages.length > 0,
      user_messages: messages.filter((m: any) => !m.is_bot && m.chat_id !== botId),
      all_messages: messages,
      current_chat_id_setting: null, // preenchido pelo cliente
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
