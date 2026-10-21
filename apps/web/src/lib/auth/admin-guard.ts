// ============================================================
// Guard de admin reutilizável (API routes e páginas)
// 401 sem sessão, 403 com sessão sem perfil ADMIN/SUPER_ADMIN
// ============================================================

import { NextResponse } from 'next/server';
import { getSession, type Session } from '@/lib/auth/session';

export type AdminGuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

export async function guardAdmin(): Promise<AdminGuardResult> {
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }
  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return { ok: false, response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }
  return { ok: true, session };
}
