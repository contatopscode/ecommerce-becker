// ============================================================
// API: Cron de lembretes de entrega 24h (protegido por CRON_TOKEN)
// POST/GET /api/cron/delivery-reminders
//   → chama sendDeliveryReminders() que busca deliveries OUT_FOR_DELIVERY
//     há mais de 24h e envia lembrete via WhatsApp
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { sendDeliveryReminders } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token') || req.nextUrl.searchParams.get('token');
  if (!process.env.CRON_TOKEN || token !== process.env.CRON_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await sendDeliveryReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[cron/delivery-reminders] Error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
