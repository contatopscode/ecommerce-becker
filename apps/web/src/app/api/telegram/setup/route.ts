// ============================================================
// API: Setup Telegram (auto-detecta OU configura manualmente)
// POST /api/telegram/setup
// Body: { manualChatId?: string, testAfter?: boolean }
//
// Valida SEMPRE que o chat_id é diferente do bot_id.
// Se for igual, rejeita (Telegram: "bot can't send messages to the bot").
//
// Retorna SEMPRE info do bot (username, link t.me) pra UI usar.
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

    // Pega info do bot (sempre — pra mostrar username/link)
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const me = await meRes.json();
    const botId = me.result?.id ? String(me.result.id) : null;
    const botUsername = me.result?.username || 'seu-bot';
    const botLink = `https://t.me/${botUsername}`;

    let chatId = manualChatId;
    let detected = false;
    let fromName = null;
    let candidates: Array<{chatId: string, from: string, text: string}> = [];

    // Se não veio manual, tenta auto-detectar
    if (!chatId) {
      const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=20&allowed_updates=["message","channel_post"]`);
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
          if (msg.from?.is_bot) continue; // ignora mensagens de outros bots
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
            error: 'Nenhuma mensagem de USUÁRIO recebida (só tem mensagem do próprio bot)',
            bot: { id: botId, username: botUsername, link: botLink },
            hint: `Você mandou "oi" pro @${botUsername}?`,
            steps: [
              `1. Abra o Telegram no celular`,
              `2. Clique no link: ${botLink}`,
              `3. IMPORTANTE: clique em "START" ou mande qualquer mensagem`,
              `4. Volte aqui e clique em "Detectar" de novo`,
              `OU digite seu chat_id manualmente abaixo`,
            ],
          });
        }
      } else {
        return NextResponse.json({
          ok: false,
          error: 'Nenhuma mensagem recebida pelo bot',
          bot: { id: botId, username: botUsername, link: botLink },
          hint: 'O bot ainda não recebeu nenhuma mensagem',
          steps: [
            `1. Abra o Telegram no celular`,
            `2. Clique no link: ${botLink}`,
            `3. Mande qualquer mensagem (ex: "oi" ou "/start")`,
            `4. Volte aqui e clique em "Detectar" de novo`,
            `OU digite seu chat_id manualmente abaixo`,
          ],
        });
      }
    }

    if (!chatId || !/^-?\d+$/.test(chatId)) {
      return NextResponse.json({
        ok: false,
        error: 'Chat ID inválido (deve ser só números, ex: 123456789)',
        bot: { id: botId, username: botUsername, link: botLink },
      }, { status: 400 });
    }

    // VALIDAÇÃO CRÍTICA: chat_id não pode ser o ID do bot
    if (chatId === botId) {
      return NextResponse.json({
        ok: false,
        error: `❌ O chat_id (${chatId}) é o ID do próprio bot! Telegram não permite isso.`,
        bot: { id: botId, username: botUsername, link: botLink },
        hint: 'Você precisa do ID de um USUÁRIO (não do bot)',
        steps: [
          `1. Abra o Telegram`,
          `2. Procure por: @userinfobot (ou @getidsbot)`,
          `3. Manda /start`,
          `4. Ele te dá teu ID de usuário (começa com 1, 5, 6, etc)`,
          `5. Cola aqui`,
        ],
        detected_bot_id: botId,
      }, { status: 400 });
    }

    // TESTA envio antes de salvar
    let testResult: { ok: boolean; error?: string } = { ok: false };
    if (testAfter !== false) {
      testResult = await sendTelegram(
        `🧪 *Teste Becker*\n\n` +
        `Salvando chat_id: \`${chatId}\`\n` +
        (fromName ? `Nome: ${fromName}\n` : '') +
        `\nSe você está vendo isso, está tudo certo! ✅`
      );
      if (!testResult.ok) {
        return NextResponse.json({
          ok: false,
          error: `Não foi possível enviar mensagem: ${testResult.error}`,
          bot: { id: botId, username: botUsername, link: botLink },
          hint: 'O chat_id pode estar errado ou o usuário bloqueou o bot',
          steps: [
            '1. Verifique se o chat_id está correto',
            '2. Certifique que você mandou /start pro bot',
            '3. Certifique que NÃO bloqueou o bot',
          ],
        }, { status: 400 });
      }
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

    // Envia mensagem de boas-vindas
    if (testAfter !== false) {
      await sendTelegram(
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
    }

    return NextResponse.json({
      ok: true,
      chatId,
      detected,
      fromName,
      bot: { id: botId, username: botUsername, link: botLink },
      message: detected
        ? `Chat ID de ${fromName} detectado, testado e salvo! 🎉`
        : `Chat ID ${chatId} salvo e testado com sucesso! 🎉`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// GET: diagnostica com bot info + user messages filtradas
export async function GET() {
  try {
    const tokenSetting = await prisma.setting.findUnique({
      where: { key: 'integrations_telegram_bot_token' },
    });
    if (!tokenSetting?.value) {
      return NextResponse.json({ ok: false, error: 'Bot token não configurado' }, { status: 400 });
    }

    const [meRes, updatesRes, chatIdSetting] = await Promise.all([
      fetch(`https://api.telegram.org/bot${tokenSetting.value}/getMe`),
      fetch(`https://api.telegram.org/bot${tokenSetting.value}/getUpdates?limit=20`),
      prisma.setting.findUnique({ where: { key: 'integrations_telegram_chat_id' } }),
    ]);
    const [me, updates] = await Promise.all([meRes.json(), updatesRes.json()]);

    const botId = me.result?.id ? String(me.result.id) : null;
    const botUsername = me.result?.username || 'seu-bot';
    const allMessages = (updates.result || [])
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
      bot: {
        id: botId,
        username: botUsername,
        first_name: me.result?.first_name,
        link: `https://t.me/${botUsername}`,
      },
      has_messages: allMessages.length > 0,
      user_messages: allMessages.filter((m: any) => !m.is_bot && m.chat_id !== botId),
      all_messages: allMessages,
      current_chat_id: chatIdSetting?.value || null,
      current_chat_id_is_bot: chatIdSetting?.value === botId,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
