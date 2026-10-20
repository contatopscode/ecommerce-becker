// ============================================================
// API: Verificar cupom de primeira compra
// GET /api/cupom/first-buy?whatsapp=5581999999999
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getFirstBuyCoupon } from '@/lib/cupom-first-buy';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // Rate limit: 30 req / min
  const limited = checkRateLimit(req, LIMITS.CART_SAVE);
  if (limited) return limited;

  try {
    const whatsapp = req.nextUrl.searchParams.get('whatsapp') || '';
    const result = await getFirstBuyCoupon(whatsapp);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    console.error('[cupom/first-buy] Erro:', e);
    return NextResponse.json({ ok: false, error: (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
