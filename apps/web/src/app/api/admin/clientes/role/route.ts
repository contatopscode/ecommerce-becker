// ============================================================
// API Admin: Mudar role do cliente
// POST /api/admin/clientes/role
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';

const VALID_ROLES = ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ ok: false, error: 'Apenas SUPER_ADMIN pode mudar roles' }, { status: 403 });
    }

    const { userId, role } = await req.json();
    if (!userId || !role) {
      return NextResponse.json({ ok: false, error: 'userId e role obrigatórios' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ ok: false, error: 'Role inválido' }, { status: 400 });
    }

    // Não pode rebaixar a si mesmo
    if (userId === session.userId && role !== 'SUPER_ADMIN') {
      return NextResponse.json({ ok: false, error: 'Não pode rebaixar a si mesmo' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, name: true, whatsapp: true, role: true },
    });

    return NextResponse.json({ ok: true, user: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
