// ============================================================
// API: Verify 2FA (confirma setup OU valida durante login)
// POST /api/auth/2fa/verify
// Body: { token, confirmSetup?: boolean }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { confirmSetup2FA, verify2FA } from '@/lib/auth/2fa';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Não autenticado' }, { status: 401 });
  }

  try {
    const { token, confirmSetup } = await req.json();

    if (!token || token.length !== 6) {
      return NextResponse.json({ ok: false, error: 'Código inválido' }, { status: 400 });
    }

    if (confirmSetup) {
      // Confirmando setup
      const success = await confirmSetup2FA(session.userId, token);
      if (!success) {
        return NextResponse.json({ ok: false, error: 'Código incorreto' }, { status: 400 });
      }
      return NextResponse.json({ ok: true, message: '2FA ativado com sucesso' });
    }

    // Validando durante login
    const valid = await verify2FA(session.userId, token);
    if (!valid) {
      return NextResponse.json({ ok: false, error: 'Código incorreto' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
