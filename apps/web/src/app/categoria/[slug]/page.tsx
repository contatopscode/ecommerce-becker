// ============================================================
// Categoria - listagem com filtros
// ============================================================

import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts, fetchCategories, fetchCategoryBySlug } from '@/lib/products';
import { CategorySort } from './CategorySort';

export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sort } = await searchParams;

  const [categories, products, category] = await Promise.all([
    fetchCategories(),
    fetchProducts({
      category: slug === 'todos' ? undefined : slug,
      orderBy: (sort as any) || 'recent',
    }),
    slug === 'todos' ? null : fetchCategoryBySlug(slug),
  ]);

  if (slug !== 'todos' && !category) notFound();

  return (
    <>
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-sm text-becker-slate mb-4">
          <a href="/" className="hover:underline">Home</a> ›{' '}
          <span className="text-becker-ink font-medium">{category?.name || 'Todos os produtos'}</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-4xl">{category?.icon || '🛍️'}</span>
              <h1 className="display text-3xl lg:text-4xl font-extrabold">
                {category?.name || 'Todos os produtos'}
              </h1>
            </div>
            {category?.description && (
              <p className="text-becker-slate mt-1">{category.description}</p>
            )}
            <p className="text-becker-slate text-sm mt-1">{products.length} {products.length === 1 ? 'produto' : 'produtos'}</p>
          </div>
          <CategorySort currentSort={sort || 'recent'} />
        </div>

        {slug === 'todos' && (
          <div className="flex gap-2 overflow-x-auto mb-6 scroll-hide">
            {categories.map((c) => (
              <a
                key={c.id}
                href={`/categoria/${c.slug}`}
                className="px-4 py-2 rounded-full bg-white border border-becker-line text-sm font-medium hover:border-becker-purple whitespace-nowrap"
              >
                {c.icon} {c.name}
              </a>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="display text-xl font-bold mb-2">Nenhum produto encontrado</h3>
            <p className="text-becker-slate mb-4">Volte para a home e explore outras categorias.</p>
            <a href="/" className="inline-block bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full">
              Voltar à home
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => <ProductCard key={p.id} product={p as any} />)}
          </div>
        )}
      </div>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
