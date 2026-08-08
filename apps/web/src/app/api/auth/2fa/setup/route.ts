// ============================================================
// API: Setup 2FA (inicia configuração)
// POST /api/auth/2fa/setup
// Retorna: { secret, otpauth, backupCodes }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { setup2FA } from '@/lib/auth/2fa';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
  }

  // Apenas ADMIN/SUPER_ADMIN pode ativar 2FA
  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ ok: false, error: 'Apenas admins podem ativar 2FA' }, { status: 403 });
  }

  try {
    const result = await setup2FA(session.userId);
    return NextResponse.json({
      ok: true,
      secret: result.secret,
      otpauth: result.otpauth,
      backupCodes: result.backupCodes,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
