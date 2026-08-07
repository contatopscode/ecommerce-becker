// ============================================================
// API: Teste de notificação admin
// POST /api/admin/notify-test
//
// Envia mensagem de teste pro WhatsApp do admin via Evolution
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { notifyAdmin } from '@/lib/whatsapp-admin';

export async function POST(req: NextRequest) {
  try {
    // Auth: só admin pode testar
    const session = await getSession();
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.role)) {
      return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 401 });
    }

    const result = await notifyAdmin(
      `🧪 *Teste de notificação admin*\n\n` +
      `Recebido por: ${session.name}\n` +
      `WhatsApp: ${session.whatsapp}\n` +
      `Data: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife' })}\n\n` +
      `Se você está vendo isso, está tudo certo! ✅\n\n` +
      `Você vai receber aqui:\n` +
      `• 🛒 Novos pedidos\n` +
      `• 💰 Pagamentos confirmados\n` +
      `• 🚚 Envios\n` +
      `• 🎯 Leads capturados`
    );

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'Mensagem de teste enviada pro WhatsApp do admin',
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
