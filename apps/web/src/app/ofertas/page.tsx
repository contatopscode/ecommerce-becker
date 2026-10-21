// ============================================================
// Ofertas
// ============================================================

import { PageShell } from '@/components/PageShell';
import { ProductCard } from '@/components/ProductCard';
import { KitCard } from '@/components/KitCard';
import { fetchProducts } from '@/lib/products';
import { fetchActiveKits } from '@/lib/kits';

export const dynamic = 'force-dynamic';

export default async function OfertasPage() {
  const [all, allKits] = await Promise.all([fetchProducts({ take: 50 }), fetchActiveKits()]);
  const kits = allKits.filter((k) => k.originalPrice > k.price);
  const products = all.filter((p) => p.versions.some((v) => v.originalPrice && Number(v.originalPrice) > Number(v.price)));

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-becker-orange text-white rounded-3xl p-8 mb-8 text-center">
          <h1 className="display text-4xl font-extrabold mb-2">🔥 Ofertas Imperdíveis</h1>
          <p className="text-white/90">Aproveite descontos de até 30% em produtos selecionados!</p>
        </div>
        {products.length === 0 && kits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-becker-slate">Nenhuma oferta no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {kits.map((k) => <KitCard key={`kit-${k.id}`} kit={k} />)}
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </PageShell>
  );
}
