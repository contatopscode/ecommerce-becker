// ============================================================
// Kits como produtos: consulta compartilhada de kits ativos
// Usada por home, busca, categoria, ofertas e /api/search.
// Só devolve kits ativos, com preço > 0 e que tenham itens.
// ============================================================

import { prisma, Prisma } from '@becker/db';
import { ensureKitsSeeded } from '@/lib/ensure-kits-seeded';

export interface KitSummary {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string;
  category: string | null;
  image: string | null;
  price: number;
  originalPrice: number;
  discountPercent: number;
  isFeatured: boolean;
  itemCount: number;
}

export interface FetchKitsOptions {
  /** Termo de busca (nome, descrição ou categoria do kit) */
  search?: string;
  /** Categoria do kit (campo `category` do Kit, ex.: "casa") */
  category?: string;
  take?: number;
  /** Faixa de preço do kit */
  minPrice?: number;
  maxPrice?: number;
}

const DEFAULT_KITS_TAKE = 48;

/** Garante caminho absoluto no site para a foto (evita URL relativa quebrada). */
export function kitImageSrc(image: string | null | undefined): string | null {
  if (!image) return null;
  const trimmed = image.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('//') || /^data:/i.test(trimmed)) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export async function fetchActiveKits(opts?: FetchKitsOptions): Promise<KitSummary[]> {
  await ensureKitsSeeded();

  const where: Prisma.KitWhereInput = {
    isActive: true,
    price: { gt: 0 },
    items: { some: {} },
  };
  const priceFilter: Prisma.DecimalFilter = { gt: 0 };
  if (opts?.minPrice !== undefined && Number.isFinite(opts.minPrice)) priceFilter.gte = opts.minPrice;
  if (opts?.maxPrice !== undefined && Number.isFinite(opts.maxPrice)) priceFilter.lte = opts.maxPrice;
  where.price = priceFilter;
  if (opts?.category) {
    where.category = { equals: opts.category, mode: 'insensitive' };
  }
  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { shortDescription: { contains: opts.search, mode: 'insensitive' } },
      { description: { contains: opts.search, mode: 'insensitive' } },
      { category: { contains: opts.search, mode: 'insensitive' } },
      { items: { some: { productName: { contains: opts.search, mode: 'insensitive' } } } },
    ];
  }

  const kits = await prisma.kit.findMany({
    where,
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    take: opts?.take ?? DEFAULT_KITS_TAKE,
    include: { _count: { select: { items: true } } },
  });

  return kits.map((k) => ({
    id: k.id,
    slug: k.slug,
    name: k.name,
    shortDescription: k.shortDescription,
    description: k.description,
    category: k.category,
    image: kitImageSrc(k.image),
    price: Number(k.price),
    originalPrice: Number(k.originalPrice),
    discountPercent: k.discountPercent,
    isFeatured: k.isFeatured,
    itemCount: k._count.items,
  }));
}
