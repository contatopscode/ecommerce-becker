// ============================================================
// API: Status do 2FA
// GET /api/auth/2fa/status
// ============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@becker/db';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { twoFactorEnabled: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    enabled: user.twoFactorEnabled,
    canEnable: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN',
  });
}
