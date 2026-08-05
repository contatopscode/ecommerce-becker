// ============================================================
// API Admin: Editar/Deletar produto
// PUT    /api/admin/produtos/[id]
// DELETE /api/admin/produtos/[id]
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;
    const data = await req.json();
    const { name, slug, description, shortDescription, sku, categoryId, active, isTop, isFeatured, isNew, isEco, imageUrl, version } = data;

    // Verificar se existe
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ ok: false, error: 'Produto não encontrado' }, { status: 404 });
    }

    // Verificar slug único (se mudou)
    if (slug && slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug } });
      if (slugExists) {
        return NextResponse.json({ ok: false, error: 'Slug já existe' }, { status: 400 });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description: description || null,
        shortDescription: shortDescription || null,
        sku: sku || existing.sku,
        categoryId,
        active: active ?? existing.active,
        isTop: isTop ?? existing.isTop,
        isFeatured: isFeatured ?? existing.isFeatured,
        isNew: isNew ?? existing.isNew,
        isEco: isEco ?? existing.isEco,
      },
    });

    // Atualizar imagem principal
    if (imageUrl) {
      const existingImage = await prisma.productImage.findFirst({
        where: { productId: id, isCover: true },
      });
      if (existingImage) {
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: { url: imageUrl },
        });
      } else {
        await prisma.productImage.create({
          data: {
            productId: id,
            url: imageUrl,
            isCover: true,
            isPrimary: true,
            order: 0,
          },
        });
      }
    }

    // Atualizar versão principal (cria se não existir)
    if (version) {
      const existingVersion = await prisma.productVersion.findFirst({
        where: { productId: id },
        orderBy: { price: 'asc' },
      });
      if (existingVersion) {
        await prisma.productVersion.update({
          where: { id: existingVersion.id },
          data: {
            label: version.label || existingVersion.label,
            price: version.price ?? Number(existingVersion.price),
            stock: version.stock ?? existingVersion.stock,
            weight: version.weight ?? existingVersion.weight,
          },
        });
      } else {
        await prisma.productVersion.create({
          data: {
            productId: id,
            label: version.label || name,
            sku: version.sku || sku || existing.sku || `BK-${slug.slice(0, 15).toUpperCase()}`,
            price: version.price || 0,
            stock: version.stock || 0,
            weight: version.weight || 500,
            active: true,
          },
        });
      }
    }

    return NextResponse.json({ ok: true, product });
  } catch (e: any) {
    console.error('[admin/produtos PUT] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete: marca active=false (preserva histórico de pedidos)
    await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ ok: true, message: 'Produto desativado' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
