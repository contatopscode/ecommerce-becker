// ============================================================
// Guard de admin reutilizável (API routes e páginas)
// 401 sem sessão, 403 com sessão sem perfil ADMIN/SUPER_ADMIN
// ============================================================

import { NextResponse } from 'next/server';
import { getSession, type Session } from '@/lib/auth/session';

export type AdminGuardResult =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

function hostOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.includes('://') ? value : `http://${value}`).host.toLowerCase();
  } catch {
    return null;
  }
}

function trustedHosts(request: Request): Set<string> {
  const hosts = new Set<string>();
  const add = (v: string | null | undefined) => {
    const h = hostOf(v);
    if (h) hosts.add(h);
  };
  add(process.env.NEXTAUTH_URL);
  add(process.env.SITE_DOMAIN);
  add(request.headers.get('x-forwarded-host')?.split(',')[0]?.trim());
  add(request.headers.get('host'));
  return hosts;
}

/** Protege contra CSRF: em métodos que alteram estado, Origin (se enviado) deve ser do próprio site. */
export function isSameOrigin(request: Request): boolean {
  if (request.method === 'GET' || request.method === 'HEAD' || request.method === 'OPTIONS') return true;
  const origin = request.headers.get('origin');
  if (origin === null) return true;
  const originHost = origin === 'null' ? null : hostOf(origin);
  return originHost !== null && trustedHosts(request).has(originHost);
}

export async function guardAdmin(request: Request): Promise<AdminGuardResult> {
  if (!isSameOrigin(request)) {
    return { ok: false, response: NextResponse.json({ error: 'Origem não permitida' }, { status: 403 }) };
  }
  const session = await getSession();
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }
  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return { ok: false, response: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) };
  }
  return { ok: true, session };
}
