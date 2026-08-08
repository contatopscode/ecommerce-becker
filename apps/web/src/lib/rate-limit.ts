// ============================================================
// Rate Limiting - In-memory (suficiente para 1 instância)
// Para múltiplas instâncias, substituir por Redis (Upstash)
// ============================================================

import 'server-only';

interface RateLimitConfig {
  max: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpeza periódica (a cada 5 minutos)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Verifica e registra uma request
 * Retorna: { ok, remaining, resetAt }
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || entry.resetAt < now) {
    // Primeira request ou janela expirada
    store.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { ok: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  const ok = entry.count <= config.max;
  const remaining = Math.max(0, config.max - entry.count);

  return { ok, remaining, resetAt: entry.resetAt };
}

/**
 * Pega IP do request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
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
  limit: RateLimitConfig
): NextResponse | null {
  const ip = getClientIp(req);
  const result = rateLimit(ip, limit);

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
