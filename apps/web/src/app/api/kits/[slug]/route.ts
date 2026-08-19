// ============================================================
// API: Detalhe de um Kit Becker
// GET /api/kits/[slug]
//   → retorna o kit + itens detalhados (com produto, versão, preço)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { ensureKitsSeeded } from '@/lib/ensure-kits-seeded';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await ensureKitsSeeded();

    const kit = await prisma.kit.findUnique({
      where: { slug },
      include: {
        items: {
          include: {
            // Não temos relation com Product, mas temos o snapshot
            // (productId é o id, productName é o nome)
          },
        },
      },
    });

    if (!kit || !kit.isActive) {
      return NextResponse.json(
        { ok: false, error: 'Kit não encontrado' },
        { status: 404 }
      );
    }

    // Enriquece com dados de produtos (imagens, slugs)
    const productIds = kit.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { where: { isPrimary: true }, take: 1 },
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return NextResponse.json({
      ok: true,
      kit: {
        id: kit.id,
        slug: kit.slug,
        name: kit.name,
        shortDescription: kit.shortDescription,
        description: kit.description,
        category: kit.category,
        image: kit.image,
        price: Number(kit.price),
        originalPrice: Number(kit.originalPrice),
        discountPercent: kit.discountPercent,
        isFeatured: kit.isFeatured,
        items: kit.items.map((it) => {
          const product = productMap.get(it.productId);
          return {
            productId: it.productId,
            productSlug: product?.slug,
            productName: it.productName,
            image: product?.images[0]?.url,
            versionId: it.versionId,
            versionLabel: it.versionLabel,
            qty: it.qty,
          };
        }),
      },
    });
  } catch (e: any) {
    console.error('[api/kits/[slug]] Error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro ao buscar kit' },
      { status: 500 }
    );
  }
}
