// ============================================================
// Cookie assinado (HMAC-SHA256)
// Formato: base64url(payloadJson).base64url(hmac)
// O payload carrega `exp` (epoch em segundos). Qualquer falha => null.
// ============================================================

import crypto from 'crypto';

let devSecret: string | null = null;

export function getSecret(): string {
  const fromEnv = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET ou NEXTAUTH_SECRET não configurado');
  }
  // Dev: segredo aleatório por processo (sessões não sobrevivem a reinício)
  if (!devSecret) devSecret = crypto.randomBytes(32).toString('hex');
  return devSecret;
}

function hmac(data: string): Buffer {
  return crypto.createHmac('sha256', getSecret()).update(data).digest();
}

/** Assina o payload com expiração de maxAgeSec segundos. */
export function signValue(payload: Record<string, unknown>, maxAgeSec: number): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  return `${body}.${hmac(body).toString('base64url')}`;
}

/** Verifica assinatura e expiração. Devolve o payload (com `exp`) ou null. */
export function verifyValue(token: string | undefined | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const given = Buffer.from(sig, 'base64url');
    const expected = hmac(body);
    if (given.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(given, expected)) return null;
    const payload: unknown = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null;
    const exp = (payload as Record<string, unknown>).exp;
    if (typeof exp !== 'number' || exp <= Math.floor(Date.now() / 1000)) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
