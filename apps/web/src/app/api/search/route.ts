// ============================================================
// API: Busca de produtos (Sprint 4)
// GET /api/search?q=multi&limit=8
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // Rate limit: 60 req / min por IP
  const limited = checkRateLimit(req, LIMITS.SEARCH);
  if (limited) return limited;

  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '8');

  if (q.length < 2) {
    return NextResponse.json({ ok: true, products: [], categories: [], total: 0 });
  }

  try {
    // Buscar produtos
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { shortDescription: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        images: { take: 1, orderBy: { order: 'asc' } },
        versions: { take: 1, orderBy: { price: 'asc' } },
      },
      take: limit,
    });

    // Buscar categorias que combinam
    const categories = await prisma.category.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, slug: true, name: true, icon: true, color: true },
      take: 3,
    });

    return NextResponse.json({
      ok: true,
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        shortDescription: p.shortDescription,
        image: p.images[0]?.url || null,
        price: p.versions[0] ? Number(p.versions[0].price) : null,
      })),
      categories,
      total: products.length + categories.length,
    });
  } catch (e: any) {
    console.error('[search] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
