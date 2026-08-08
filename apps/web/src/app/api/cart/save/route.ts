// ============================================================
// API: Salvar carrinho do cliente
// POST /api/cart/save
// Chamado pelo frontend quando cliente digita WhatsApp no checkout
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { saveCart } from '@/lib/cart-recovery';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 30 req / min (carrinho atualiza frequente)
  const limited = checkRateLimit(req, LIMITS.CART_SAVE);
  if (limited) return limited;

  try {
    const { whatsapp, customerName, items, cupom } = await req.json();

    const result = await saveCart({ whatsapp, customerName, items, cupom });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e: any) {
    console.error('[cart/save] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
