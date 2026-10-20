// ============================================================
// API: Validar cupom
// POST /api/cupom/validate
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { verificarCupom } from '@/lib/cupom';

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json();

    if (typeof orderTotal !== 'number' || !Number.isFinite(orderTotal) || orderTotal <= 0) {
      return NextResponse.json({ ok: false, error: 'Total do pedido inválido' }, { status: 400 });
    }

    if (!code) {
      return NextResponse.json({ ok: false, error: 'Código obrigatório' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      return NextResponse.json({ ok: false, error: 'Cupom não encontrado' }, { status: 404 });
    }

    const check = verificarCupom(coupon, orderTotal);
    if (!check.ok) {
      return NextResponse.json({ ok: false, error: check.error }, { status: check.status });
    }

    // type pode ser 'percent' (desconto %) ou 'fixed' (valor fixo) ou 'shipping' (frete grátis)
    const percent = coupon.type === 'percent'
      ? coupon.discount
      : coupon.type === 'fixed'
        ? (coupon.discount / orderTotal) * 100
        : 0;

    return NextResponse.json({
      ok: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        percent: Math.round(percent),
        value: coupon.discount,
        minOrder: coupon.minOrder ? Number(coupon.minOrder) : null,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
