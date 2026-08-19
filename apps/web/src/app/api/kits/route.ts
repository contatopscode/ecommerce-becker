// ============================================================
// API: Lista de Kits Becker
// GET /api/kits
//   → retorna todos os kits ativos, ordenados por `order`
//   → com contagem de itens e preço range
// ============================================================

import { NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { ensureKitsSeeded } from '@/lib/ensure-kits-seeded';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Garante que os 5 kits existam (idempotente)
    await ensureKitsSeeded();

    const kits = await prisma.kit.findMany({
      where: { isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json({
      ok: true,
      kits: kits.map((k) => ({
        id: k.id,
        slug: k.slug,
        name: k.name,
        shortDescription: k.shortDescription,
        description: k.description,
        category: k.category,
        image: k.image,
        price: Number(k.price),
        originalPrice: Number(k.originalPrice),
        discountPercent: k.discountPercent,
        isFeatured: k.isFeatured,
        itemCount: k._count.items,
      })),
    });
  } catch (e: any) {
    console.error('[api/kits] Error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro ao listar kits' },
      { status: 500 }
    );
  }
}
