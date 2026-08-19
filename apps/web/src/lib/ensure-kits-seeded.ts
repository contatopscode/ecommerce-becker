// ============================================================
// Ensure kits seeded
// Verifica se os 5 kits fixos existem. Se não, roda o seed.
// Idempotente: pode ser chamado várias vezes sem efeito colateral
// ============================================================
// Uso:
//   import { ensureKitsSeeded } from '@/lib/ensure-kits-seeded';
//   await ensureKitsSeeded();  // ok em route handler, RSC, etc
// ============================================================

import { prisma } from '@becker/db';
import { seedKits } from './seed-kits';

const KIT_SLUGS = [
  'kit-limpeza-basica',
  'kit-cozinha-pratica',
  'kit-banheiro-brilhante',
  'kit-lavanderia-completa',
  'kit-casa-completa',
];

let isSeeding = false; // guard contra chamadas paralelas
let lastCheck = 0; // throttle: não checa mais que 1x por hora
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // 1h
let cachedResult: { seeded: boolean; at: number } | null = null;

/**
 * Garante que os 5 kits fixos existam.
 * - Se já existem: noop
 * - Se faltam: roda seed
 * - Throttle: checa no máximo 1x por hora (cache em memória)
 */
export async function ensureKitsSeeded(): Promise<{ seeded: boolean; created: number; updated: number; errors: string[] }> {
  const now = Date.now();

  // Throttle: se checou há < 1h, retorna o cache
  if (cachedResult && now - cachedResult.at < CHECK_INTERVAL_MS) {
    return { seeded: false, created: 0, updated: 0, errors: [] };
  }

  // Guard contra chamadas paralelas
  if (isSeeding) {
    return { seeded: true, created: 0, updated: 0, errors: ['seed em andamento'] };
  }
  isSeeding = true;

  try {
    const existing = await prisma.kit.findMany({
      where: { slug: { in: KIT_SLUGS } },
      select: { slug: true },
    });
    const existingSlugs = new Set(existing.map((k) => k.slug));
    const missing = KIT_SLUGS.filter((s) => !existingSlugs.has(s));

    if (missing.length === 0) {
      cachedResult = { seeded: false, at: now };
      return { seeded: false, created: 0, updated: 0, errors: [] };
    }

    // Roda o seed
    const result = await seedKits();
    cachedResult = { seeded: true, at: now };
    return {
      seeded: true,
      created: result.created.length,
      updated: result.updated.length,
      errors: result.errors,
    };
  } catch (e: any) {
    console.error('[ensureKitsSeeded] Error:', e);
    return { seeded: false, created: 0, updated: 0, errors: [e.message || String(e)] };
  } finally {
    isSeeding = false;
  }
}
