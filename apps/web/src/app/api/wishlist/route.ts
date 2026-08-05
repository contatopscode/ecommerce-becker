// ============================================================
// API: Buscar produtos por slug (para wishlist)
// GET /api/wishlist?slugs=slug1,slug2
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function GET(req: NextRequest) {
  const slugsParam = req.nextUrl.searchParams.get('slugs') || '';
  const slugs = slugsParam.split(',').filter(Boolean).slice(0, 50);

  if (slugs.length === 0) {
    return NextResponse.json({ ok: true, products: [] });
  }

  try {
    const products = await prisma.product.findMany({
      where: { slug: { in: slugs }, active: true },
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        versions: { where: { active: true }, orderBy: { price: 'asc' }, take: 1 },
        category: { select: { slug: true, name: true } },
      },
    });

    const serialized = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      images: p.images.map((i) => ({ url: i.url })),
      versions: p.versions.map((v) => ({
        id: v.id,
        price: Number(v.price),
        originalPrice: v.originalPrice ? Number(v.originalPrice) : null,
      })),
      category: p.category,
    }));

    return NextResponse.json({ ok: true, products: serialized });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
