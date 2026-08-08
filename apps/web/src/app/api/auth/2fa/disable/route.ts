// ============================================================
// API: Desativar 2FA
// POST /api/auth/2fa/disable
// Requer código TOTP atual para confirmar
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { disable2FA, verify2FA } from '@/lib/auth/2fa';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ ok: false, error: 'Apenas admins' }, { status: 403 });
  }

  try {
    const { token } = await req.json();

    // Confirma com código TOTP antes de desativar
    const valid = await verify2FA(session.userId, token);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Código incorreto' }, { status: 400 });
    }

    await disable2FA(session.userId);
    console.log(`[2fa] Desativado para user ${session.userId}`);

    return NextResponse.json({ ok: true, message: '2FA desativado' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
