// ============================================================
// Página de busca
// ============================================================

import { PageShell } from '@/components/PageShell';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const results = q ? await fetchProducts({ search: q, take: 30 }) : [];

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-sm text-becker-slate mb-4">
          <a href="/" className="hover:underline">Home</a> › <span className="text-becker-ink font-medium">Busca</span>
        </div>
        <h1 className="display text-3xl lg:text-4xl font-extrabold mb-1">Resultados para "{q}"</h1>
        <p className="text-becker-slate mb-8">
          {results.length === 0 && q ? 'Nenhum resultado' : `${results.length} ${results.length === 1 ? 'produto' : 'produtos'}`}
        </p>
        {results.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="display text-xl font-bold mb-2">Nada encontrado</h3>
            <p className="text-becker-slate mb-4">Tente "lava roupas", "álcool", "amaciante"...</p>
            <a href="/" className="inline-block bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full">Voltar à home</a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {results.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </PageShell>
  );
}
