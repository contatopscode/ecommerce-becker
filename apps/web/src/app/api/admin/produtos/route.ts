// ============================================================
// API Admin: Criar produto
// POST /api/admin/produtos
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 403 });
    }

    const data = await req.json();
    const { name, slug, description, shortDescription, sku, categoryId, active, isTop, isFeatured, isNew, isEco, imageUrl, version } = data;

    if (!name || !slug || !categoryId) {
      return NextResponse.json({ ok: false, error: 'Nome, slug e categoria obrigatórios' }, { status: 400 });
    }

    // Verificar slug único
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ ok: false, error: 'Slug já existe' }, { status: 400 });
    }

    const id = randomBytes(12).toString('hex');
    const product = await prisma.product.create({
      data: {
        id,
        name,
        slug,
        description: description || null,
        shortDescription: shortDescription || null,
        sku: sku || `BK-${slug.slice(0, 15).toUpperCase()}`,
        categoryId,
        active: active ?? true,
        isTop: isTop ?? false,
        isFeatured: isFeatured ?? false,
        isNew: isNew ?? false,
        isEco: isEco ?? false,
        rating: 0,
        reviewCount: 0,
      },
    });

    // Criar versão
    if (version) {
      const versionId = randomBytes(12).toString('hex');
      await prisma.productVersion.create({
        data: {
          id: versionId,
          productId: product.id,
          label: version.label || name,
          sku: version.sku || sku || `BK-${slug.slice(0, 15).toUpperCase()}`,
          price: version.price || 0,
          stock: version.stock || 0,
          weight: version.weight || 500,
          active: true,
        },
      });
    }

    // Criar imagem
    if (imageUrl) {
      const imageId = randomBytes(12).toString('hex');
      await prisma.productImage.create({
        data: {
          id: imageId,
          productId: product.id,
          url: imageUrl,
          isCover: true,
          isPrimary: true,
          order: 0,
        },
      });
    }

    return NextResponse.json({ ok: true, product });
  } catch (e: any) {
    console.error('[admin/produtos POST] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
