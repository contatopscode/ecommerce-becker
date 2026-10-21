// ============================================================
// Rate Limiting - In-memory (suficiente para 1 instância)
// Para múltiplas instâncias, substituir por Redis (Upstash)
// ============================================================

import 'server-only';

import { clientIpFromHeaders, rateLimit, rateLimitKey, type RateLimitConfig } from './rate-limit-core';

export { clientIpFromHeaders, rateLimit };

export function getClientIp(req: Request): string {
  return clientIpFromHeaders(req.headers);
}

// ============== LIMITES PRÉ-DEFINIDOS ==============

export const LIMITS = {
  // Auth
  OTP_REQUEST: { max: 5, windowMs: 15 * 60 * 1000 },     // 5 req / 15 min
  OTP_VERIFY: { max: 10, windowMs: 15 * 60 * 1000 },     // 10 req / 15 min
  // Pedidos
  CREATE_ORDER: { max: 10, windowMs: 60 * 60 * 1000 },   // 10 req / hora
  // Carrinho (Sprint 9)
  CART_SAVE: { max: 30, windowMs: 60 * 1000 },            // 30 req / min
  // Admin
  ADMIN_API: { max: 100, windowMs: 60 * 1000 },          // 100 req / min
  // Público
  CEP_LOOKUP: { max: 30, windowMs: 60 * 1000 },          // 30 req / min
  SEARCH: { max: 60, windowMs: 60 * 1000 },              // 60 req / min
} as const;

/**
 * Helper que aplica rate limit e retorna NextResponse se excedeu
 */
import { NextResponse } from 'next/server';

export function checkRateLimit(
  req: Request,
  limit: RateLimitConfig,
  name: string
): NextResponse | null {
  const ip = getClientIp(req);
  const result = rateLimit(rateLimitKey(name, ip), limit);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: 'Muitas requisições. Tente novamente mais tarde.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit.max),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  return null;
}
