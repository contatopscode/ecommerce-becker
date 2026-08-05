// ============================================================
// API: Testar Telegram
// POST /api/telegram/test
// Envia uma mensagem de teste pro chat configurado
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { sendTelegram, telegramTemplates } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    // Tenta enviar mensagem de teste
    const result = await sendTelegram(
      '🧪 *Teste do Becker Bot*\n\n' +
      'Se você recebeu esta mensagem, a integração com o Telegram está funcionando! 🎉\n\n' +
      'A partir de agora você vai receber:\n' +
      '• Notificações de novos pedidos\n' +
      '• Status de pagamento\n' +
      '• Avisos de envio e entrega\n' +
      '• Captura de leads\n\n' +
      'Mande "ajuda" pra ver os comandos disponíveis.'
    );

    if (result.ok) {
      return NextResponse.json({ ok: true, message: 'Mensagem enviada!' });
    } else {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
