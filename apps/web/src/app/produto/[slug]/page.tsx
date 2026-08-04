// ============================================================
// Página de produto (Server Component)
// A interatividade (qty, versões, CEP, carrinho) fica no ProductClient
// ============================================================

import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ProductCard } from '@/components/ProductCard';
import { ProductClient } from './ProductClient';
import { fetchProductBySlug, fetchRelatedProducts } from '@/lib/products';
import { prisma } from '@becker/db';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) return { title: 'Produto não encontrado' };
  return {
    title: product.name,
    description: product.shortDescription || product.description.substring(0, 160),
    openGraph: {
      title: product.name,
      description: product.shortDescription || '',
      images: product.images[0] ? [product.images[0].url] : [],
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await fetchProductBySlug(slug);
  if (!product) notFound();

  const related = await fetchRelatedProducts(product.id, product.categoryId);

  // Schema.org JSON-LD para SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((i) => i.url),
    brand: { '@type': 'Brand', name: product.brand },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'BRL',
      lowPrice: Math.min(...product.versions.map((v) => Number(v.price))),
      highPrice: Math.max(...product.versions.map((v) => Number(v.price))),
      offerCount: product.versions.length,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.rating,
      reviewCount: product.reviewCount,
    },
  };

  return (
    <>
      <Header />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="text-sm text-becker-slate">
          <a href="/" className="hover:underline">Home</a> ›{' '}
          <a href={`/categoria/${product.category.slug}`} className="hover:underline">
            {product.category.name}
          </a>{' '}
          › <span className="text-becker-ink font-medium">{product.name}</span>
        </div>
      </div>

      <ProductClient product={product} />

      {/* Descrição */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="bg-white rounded-3xl border border-becker-line p-8">
          <h2 className="display text-2xl font-extrabold mb-3">Descrição do produto</h2>
          <p className="text-becker-ink leading-relaxed">{product.description}</p>
          {product.highlights.length > 0 && (
            <ul className="mt-4 grid sm:grid-cols-2 gap-2 text-sm">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-eco-500">✓</span> {h}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-16">
          <h2 className="display text-2xl font-extrabold mb-6">Quem viu, também comprou</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <Footer />
      <WhatsAppButton />
    </>
  );
}
