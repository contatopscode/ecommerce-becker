// ============================================================
// Admin Produtos
// ============================================================

import { prisma } from '@becker/db';
import { ProdutosTable } from './ProdutosTable';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
  const products = await prisma.product.findMany({
    orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
    include: {
      category: { select: { name: true, slug: true } },
      images: { take: 1 },
      versions: { select: { price: true, stock: true } },
      _count: { select: { reviews: true } },
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-becker-ink">Produtos</h1>
        <div className="flex gap-2">
          <span className="text-sm text-becker-slate">
            {products.length} produto{products.length !== 1 ? 's' : ''}
          </span>
          <button className="bg-becker-purple text-white font-semibold px-4 py-2 rounded-full text-sm">
            + Adicionar
          </button>
        </div>
      </div>

      <ProdutosTable products={products} />
    </div>
  );
}
