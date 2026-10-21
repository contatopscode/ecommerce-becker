// ============================================================
// Cookie assinado (HMAC-SHA256)
// Formato: base64url(payloadJson).base64url(hmac)
// O payload carrega `exp` (epoch em segundos). Qualquer falha => null.
// ============================================================

import crypto from 'crypto';

let devSecret: string | null = null;

export const MIN_SECRET_LENGTH = 32;
const EXAMPLE_SECRET = 'trocar-por-uma-chave-segura-aqui';

/** Motivo pelo qual o segredo é fraco, ou null se aceitável. Nunca devolve o valor. */
export function secretWeakness(secret: string | undefined): string | null {
  if (!secret) return 'segredo não configurado (SESSION_SECRET ou NEXTAUTH_SECRET)';
  if (secret.length < MIN_SECRET_LENGTH) return `segredo com menos de ${MIN_SECRET_LENGTH} caracteres`;
  if (secret.includes('trocar-por') || secret === EXAMPLE_SECRET) return 'segredo é o valor de exemplo do .env.example';
  return null;
}

export function getSecret(): string {
  const fromEnv = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    const weak = secretWeakness(fromEnv);
    if (weak || !fromEnv) throw new Error(`Segredo de sessão inválido: ${weak}`);
    return fromEnv;
  }
  if (fromEnv) return fromEnv;
  // Dev: segredo aleatório por processo (sessões não sobrevivem a reinício)
  if (!devSecret) devSecret = crypto.randomBytes(32).toString('hex');
  return devSecret;
}

export type CookieType = 'session' | 'otp';

/** Chave derivada por finalidade: HMAC(segredo, typ). */
function keyFor(typ: CookieType): Buffer {
  return crypto.createHmac('sha256', getSecret()).update(typ).digest();
}

function hmac(typ: CookieType, data: string): Buffer {
  return crypto.createHmac('sha256', keyFor(typ)).update(data).digest();
}

/** Assina o payload com expiração de maxAgeSec segundos. */
export function signValue(typ: CookieType, payload: Record<string, unknown>, maxAgeSec: number): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const body = Buffer.from(JSON.stringify({ ...payload, typ, exp })).toString('base64url');
  return `${body}.${hmac(typ, body).toString('base64url')}`;
}

/** Verifica assinatura e expiração. Devolve o payload (com `exp`) ou null. */
export function verifyValue(typ: CookieType, token: string | undefined | null): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const given = Buffer.from(sig, 'base64url');
    const expected = hmac(typ, body);
    if (given.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(given, expected)) return null;
    const payload: unknown = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) return null;
    if ((payload as Record<string, unknown>).typ !== typ) return null;
    const exp = (payload as Record<string, unknown>).exp;
    if (typeof exp !== 'number' || exp <= Math.floor(Date.now() / 1000)) return null;
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
