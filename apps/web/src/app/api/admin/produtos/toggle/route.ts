// ============================================================
// API Admin: Toggle flag de produto
// POST /api/admin/produtos/toggle { id, field }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';

const ALLOWED_FIELDS = ['isTop', 'isFeatured', 'isNew', 'active'] as const;

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 403 });
    }

    const { id, field } = await req.json();
    if (!id || !field || !ALLOWED_FIELDS.includes(field)) {
      return NextResponse.json({ ok: false, error: 'Parâmetros inválidos' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ ok: false, error: 'Produto não encontrado' }, { status: 404 });

    const updated = await prisma.product.update({
      where: { id },
      data: { [field]: !product[field as keyof typeof product] },
    });

    return NextResponse.json({ ok: true, product: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
