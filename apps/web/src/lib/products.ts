// ============================================================
// Server-side: acesso a produtos (Prisma)
// ============================================================

import { prisma } from '@becker/db';

export async function fetchCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });
}

export async function fetchCategoryBySlug(slug: string) {
  return prisma.category.findUnique({ where: { slug } });
}

export async function fetchProducts(opts?: {
  category?: string;
  search?: string;
  isTop?: boolean;
  isFeatured?: boolean;
  isEco?: boolean;
  isNew?: boolean;
  take?: number;
  orderBy?: 'price-asc' | 'price-desc' | 'rating' | 'recent';
}) {
  const where: any = { active: true };
  if (opts?.category && opts.category !== 'todos') {
    where.category = { slug: opts.category };
  }
  if (opts?.search) {
    where.OR = [
      { name: { contains: opts.search, mode: 'insensitive' } },
      { shortDescription: { contains: opts.search, mode: 'insensitive' } },
      { description: { contains: opts.search, mode: 'insensitive' } },
    ];
  }
  if (opts?.isTop) where.isTop = true;
  if (opts?.isFeatured) where.isFeatured = true;
  if (opts?.isEco) where.isEco = true;
  if (opts?.isNew) where.isNew = true;

  let orderBy: any = { createdAt: 'desc' };
  if (opts?.orderBy === 'rating') orderBy = { rating: 'desc' };
  if (opts?.orderBy === 'recent') orderBy = { createdAt: 'desc' };

  const products = await prisma.product.findMany({
    where,
    orderBy,
    take: opts?.take,
    include: {
      category: { select: { id: true, slug: true, name: true, icon: true, color: true } },
      images: { orderBy: { order: 'asc' } },
      versions: { where: { active: true }, orderBy: { price: 'asc' } },
    },
  });

  // Converter Decimal para number (para serializar pro client)
  const serialized = products.map((p) => ({
    ...p,
    versions: p.versions.map((v) => ({
      ...v,
      price: Number(v.price),
      originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
      weight: v.weight ?? 0,
    })),
  }));

  // sort por price se necessário
  if (opts?.orderBy === 'price-asc' || opts?.orderBy === 'price-desc') {
    serialized.sort((a, b) => {
      const pa = Math.min(...a.versions.map((v) => v.price as number));
      const pb = Math.min(...b.versions.map((v) => v.price as number));
      return opts.orderBy === 'price-asc' ? pa - pb : pb - pa;
    });
  }

  return serialized;
}

export async function fetchProductBySlug(slug: string) {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      versions: { where: { active: true }, orderBy: { price: 'asc' } },
    },
  });
  if (!p) return null;
  return {
    ...p,
    versions: p.versions.map((v) => ({
      ...v,
      price: Number(v.price),
      originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
      weight: v.weight ?? 0,
    })),
  };
}

export async function fetchRelatedProducts(productId: string, categoryId: string, take: number = 4) {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      id: { not: productId },
      categoryId,
    },
    take,
    include: {
      category: { select: { id: true, slug: true, name: true } },
      images: true,
      versions: { where: { active: true }, take: 1, orderBy: { price: 'asc' } },
    },
  });
  return products.map((p) => ({
    ...p,
    versions: p.versions.map((v) => ({
      ...v,
      price: Number(v.price),
      originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
      weight: v.weight ?? 0,
    })),
  }));
}

// Helpers
export function getPrimaryImage(p: { images: { url: string; isPrimary: boolean; order: number }[] }): string {
  const primary = p.images.find((i) => i.isPrimary) || p.images[0];
  return primary?.url || '/img/placeholder.jpg';
}

export function getPriceFrom(p: { versions: { price: any }[] }): number {
  if (p.versions.length === 0) return 0;
  return Math.min(...p.versions.map((v) => Number(v.price)));
}

export function getPriceTo(p: { versions: { price: any }[] }): number {
  if (p.versions.length === 0) return 0;
  return Math.max(...p.versions.map((v) => Number(v.price)));
}

export function getTotalStock(p: { versions: { stock: number }[] }): number {
  return p.versions.reduce((sum, v) => sum + v.stock, 0);
}
