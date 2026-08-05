// ============================================================
// API: Validar cupom
// POST /api/cupom/validate
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function POST(req: NextRequest) {
  try {
    const { code, orderTotal } = await req.json();

    if (!code) {
      return NextResponse.json({ ok: false, error: 'Código obrigatório' }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon) {
      return NextResponse.json({ ok: false, error: 'Cupom não encontrado' }, { status: 404 });
    }

    if (!coupon.active) {
      return NextResponse.json({ ok: false, error: 'Cupom inativo' }, { status: 400 });
    }

    const now = new Date();
    if (coupon.validFrom && coupon.validFrom > now) {
      return NextResponse.json({ ok: false, error: 'Cupom ainda não está válido' }, { status: 400 });
    }

    if (coupon.validUntil && coupon.validUntil < now) {
      return NextResponse.json({ ok: false, error: 'Cupom expirado' }, { status: 400 });
    }

    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ ok: false, error: 'Cupom esgotado' }, { status: 400 });
    }

    if (coupon.minOrder && orderTotal < Number(coupon.minOrder)) {
      return NextResponse.json({
        ok: false,
        error: `Pedido mínimo de R$ ${Number(coupon.minOrder).toFixed(2)} pra esse cupom`,
      }, { status: 400 });
    }

    // type pode ser 'percent' (desconto %) ou 'fixed' (valor fixo) ou 'shipping' (frete grátis)
    const percent = coupon.type === 'percent'
      ? Number(coupon.value)
      : coupon.type === 'fixed'
        ? (Number(coupon.value) / orderTotal) * 100
        : 0;

    return NextResponse.json({
      ok: true,
      coupon: {
        code: coupon.code,
        type: coupon.type,
        percent: Math.round(percent),
        value: Number(coupon.value),
        minOrder: coupon.minOrder ? Number(coupon.minOrder) : null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
