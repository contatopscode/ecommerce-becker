// ============================================================
// API: Forçar re-seed dos Kits Becker (admin/cron)
// POST /api/admin/seed-kits
//   Header: x-cron-token: <CRON_TOKEN>
//   → roda seedKits() (atualiza preços, itens, etc)
//   → retorna { created, updated, skipped, errors }
// ============================================================
// Uso:
//   curl -X POST -H "x-cron-token: $CRON_TOKEN" \
//        https://becker.pscode.ia.br/api/admin/seed-kits
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { seedKits } from '@/lib/seed-kits';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token') || req.nextUrl.searchParams.get('token');
  if (!process.env.CRON_TOKEN || token !== process.env.CRON_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const result = await seedKits();
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    console.error('[admin/seed-kits] Error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro ao rodar seed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // GET também aceita (pra teste fácil no browser)
  return POST(req);
}
