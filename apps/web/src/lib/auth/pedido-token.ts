// Token assinado de acesso a um pedido (link enviado ao cliente). Validade de 7 dias.
// Funções puras: o segredo entra por parâmetro (ver pedido-link.ts).

import crypto from 'crypto';

const TYP = 'pedido';
const MAX_AGE_SEC = 7 * 24 * 60 * 60;

function sign(secret: string, body: string): Buffer {
  const key = crypto.createHmac('sha256', secret).update(TYP).digest();
  return crypto.createHmac('sha256', key).update(body).digest();
}

export function signPedidoToken(secret: string, orderId: string, maxAgeSec: number = MAX_AGE_SEC): string {
  const exp = Math.floor(Date.now() / 1000) + maxAgeSec;
  const body = Buffer.from(JSON.stringify({ orderId, typ: TYP, exp })).toString('base64url');
  return `${body}.${sign(secret, body).toString('base64url')}`;
}

/** Devolve o orderId do token válido, ou null. */
export function verifyPedidoToken(secret: string, token: string | undefined | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [body, sig] = parts;
    const given = Buffer.from(sig, 'base64url');
    const expected = sign(secret, body);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
    const p: unknown = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof p !== 'object' || p === null) return null;
    const { typ, exp, orderId } = p as Record<string, unknown>;
    if (typ !== TYP || typeof orderId !== 'string') return null;
    if (typeof exp !== 'number' || exp <= Math.floor(Date.now() / 1000)) return null;
    return orderId;
  } catch {
    return null;
  }
}
