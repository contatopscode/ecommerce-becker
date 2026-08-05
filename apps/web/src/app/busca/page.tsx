// ============================================================
// Página de busca (Sprint 4 - com filtros)
// ============================================================

import { PageShell } from '@/components/PageShell';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts, fetchCategories } from '@/lib/products';
import { SearchFilters } from './SearchFilters';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{
  q?: string;
  categoria?: string;
  eco?: string;
  top?: string;
  novo?: string;
  precoMin?: string;
  precoMax?: string;
  ordem?: string;
}> }) {
  const params = await searchParams;
  const {
    q = '',
    categoria,
    eco, top, novo,
    precoMin, precoMax,
    ordem = 'relevante',
  } = params;

  // Filtrar
  const filters: any = {
    search: q || undefined,
    take: 60,
  };
  if (categoria && categoria !== 'todos') filters.category = categoria;
  if (eco === '1') filters.isEco = true;
  if (top === '1') filters.isTop = true;
  if (novo === '1') filters.isNew = true;
  if (ordem && ordem !== 'relevante') filters.orderBy = ordem;

  const results = await fetchProducts(filters);
  const categories = await fetchCategories();

  // Filtrar por preço localmente (já que vem do DB sem range)
  let filtered = results;
  if (precoMin) {
    const min = Number(precoMin);
    filtered = filtered.filter((p) => {
      const minPrice = Math.min(...(p.versions.map((v: any) => v.price) as number[]));
      return minPrice >= min;
    });
  }
  if (precoMax) {
    const max = Number(precoMax);
    filtered = filtered.filter((p) => {
      const minPrice = Math.min(...(p.versions.map((v: any) => v.price) as number[]));
      return minPrice <= max;
    });
  }

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-sm text-becker-slate mb-4">
          <Link href="/" className="hover:underline">Home</Link> › <span className="text-becker-ink font-medium">Busca</span>
        </div>
        <h1 className="display text-3xl lg:text-4xl font-extrabold mb-1">
          {q ? <>Resultados para <span className="text-becker-purple">"{q}"</span></> : 'Todos os produtos'}
        </h1>
        <p className="text-becker-slate mb-6">
          {filtered.length === 0
            ? 'Nenhum resultado com esses filtros'
            : `${filtered.length} ${filtered.length === 1 ? 'produto' : 'produtos'}`}
        </p>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar de filtros */}
          <aside className="lg:col-span-1">
            <SearchFilters
              categories={categories}
              activeCategory={categoria}
              activeEco={eco === '1'}
              activeTop={top === '1'}
              activeNew={novo === '1'}
              activeOrdem={ordem}
              precoMin={precoMin}
              precoMax={precoMax}
            />
          </aside>

          {/* Resultados */}
          <div className="lg:col-span-3">
            {filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-becker-line">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="display text-xl font-bold mb-2">Nada encontrado</h3>
                <p className="text-becker-slate mb-4">Tente mudar os filtros ou buscar por outro termo</p>
                <Link
                  href="/busca"
                  className="inline-block bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full"
                >
                  Limpar filtros
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
