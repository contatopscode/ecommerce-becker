// Núcleo puro do rate limit (sem server-only/next), testável em node puro.

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Limpeza periódica (a cada 5 minutos)
const cleanup = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);
cleanup.unref();

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
 * IP do cliente a partir dos cabeçalhos.
 *
 * x-forwarded-for pode vir preenchido pelo próprio cliente: cada proxy ACRESCENTA o IP que
 * viu ao FIM da lista. No Coolify/Traefik o último valor é o IP real da conexão, então só ele
 * é confiável; o primeiro é controlado pelo cliente e não serve para limite. Sem
 * x-forwarded-for, usa x-real-ip.
 */
export function clientIpFromHeaders(h: Pick<Headers, 'get'>): string {
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const parts = forwarded.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return h.get('x-real-ip')?.trim() || 'unknown';
}

/** Chave do contador: cada rota tem o seu, senão rotas diferentes dividem o mesmo limite por IP. */
export function rateLimitKey(name: string, ip: string): string {
  return `${name}:${ip}`;
}
