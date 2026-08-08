// ============================================================
// API: Processar carrinhos abandonados
// POST /api/cart/process-abandoned
// Chamado por cron externo (a cada 1 hora)
// Envia WhatsApp 1h, 24h, 72h conforme timing
// Autenticação: header x-cron-token (CRON_TOKEN env var)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { processAbandonedCarts } from '@/lib/cart-recovery';
import { isValidCronToken } from '@/lib/backup';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  try {
    const stats = await processAbandonedCarts();
    return NextResponse.json({ ok: true, ...stats });
  } catch (e: any) {
    console.error('[cart/process-abandoned] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
