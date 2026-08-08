// ============================================================
// API: Listar carrinhos abandonados (admin)
// GET /api/cart/abandoned?only=abandoned
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { listAbandonedCarts } from '@/lib/cart-recovery';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 });
  }

  try {
    const onlyAbandoned = req.nextUrl.searchParams.get('only') === 'abandoned';
    const carts = await listAbandonedCarts({ onlyAbandoned, limit: 200 });

    return NextResponse.json({
      ok: true,
      carts: carts.map((c) => ({
        id: c.id,
        whatsapp: c.whatsapp,
        customerName: c.customerName,
        items: c.items,
        subtotal: Number(c.subtotal),
        totalItems: c.totalItems,
        cupom: c.cupom,
        sent1h: c.sent1h,
        sent1hAt: c.sent1hAt,
        sent24h: c.sent24h,
        sent24hAt: c.sent24hAt,
        sent72h: c.sent72h,
        sent72hAt: c.sent72hAt,
        converted: c.converted,
        orderId: c.orderId,
        lastSeenAt: c.lastSeenAt,
        createdAt: c.createdAt,
      })),
    });
  } catch (e: any) {
    console.error('[cart/abandoned] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
