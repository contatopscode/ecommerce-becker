// ============================================================
// Admin Produtos (Sprint 5 - com CRUD)
// ============================================================

import { prisma } from '@becker/db';
import { ProdutosClient } from './ProdutosClient';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      include: {
        category: true,
        images: { take: 1, orderBy: { order: 'asc' } },
        versions: { orderBy: { price: 'asc' } },
        _count: { select: { reviews: true } },
      },
    }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  // Serializa pra passar pro client
  const serialized = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    description: p.description,
    sku: p.sku,
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    active: p.active,
    isTop: p.isTop,
    isFeatured: p.isFeatured,
    isNew: p.isNew,
    isEco: p.isEco,
    rating: Number(p.rating),
    images: p.images.map((i) => ({ id: i.id, url: i.url, isCover: i.isCover, isPrimary: i.isPrimary })),
    versions: p.versions.map((v) => ({
      id: v.id,
      label: v.label,
      sku: v.sku,
      price: Number(v.price),
      stock: v.stock,
      weight: v.weight,
    })),
  }));

  const catsSerialized = categories.map((c) => ({ id: c.id, slug: c.slug, name: c.name }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-becker-ink">Produtos</h1>
          <p className="text-sm text-becker-slate mt-1">
            {serialized.length} produto{serialized.length !== 1 ? 's' : ''} cadastrado{serialized.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <ProdutosClient initialProducts={serialized} categories={catsSerialized} />
    </div>
  );
}
