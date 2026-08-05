'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/lib/wishlist';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  images: Array<{ url: string }>;
  versions: Array<{ id: string; price: number; originalPrice: number | null }>;
  category?: { slug: string; name: string };
}

export function WishlistGrid() {
  const wishlist = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const slugs = wishlist.items;

  useEffect(() => {
    if (slugs.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/wishlist?slugs=${slugs.join(',')}`)
      .then((r) => r.json())
      .then((d) => {
        setProducts(d.products || []);
        setLoading(false);
      });
  }, [slugs.join(',')]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 mx-auto border-4 border-becker-purple border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-becker-line p-12 text-center">
        <div className="text-7xl mb-4">💝</div>
        <h2 className="text-xl font-extrabold mb-2">Nenhum favorito ainda</h2>
        <p className="text-becker-slate text-sm mb-6 max-w-md mx-auto">
          Toque no ❤ dos produtos que você curtiu. Eles ficam salvos aqui pra você não perder de vista.
        </p>
        <Link
          href="/"
          className="inline-block bg-becker-purple text-white font-semibold px-6 py-3 rounded-full"
        >
          Explorar produtos
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-sm text-becker-slate mb-4">
        {products.length} produto{products.length !== 1 ? 's' : ''} favoritado{products.length !== 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p) => (
          <WishlistCard key={p.id} product={p} />
        ))}
      </div>
    </>
  );
}

function WishlistCard({ product }: { product: Product }) {
  const wishlist = useWishlist();
  const version = product.versions[0];
  const primaryImage = product.images[0];

  return (
    <article className="bg-white rounded-2xl border border-becker-line overflow-hidden group hover:shadow-pop transition flex flex-col relative">
      <Link href={`/produto/${product.slug}`} className="product-img aspect-square grid place-items-center p-4 block overflow-hidden">
        {primaryImage?.url ? (
          <img src={primaryImage.url} alt={product.name} className="max-h-full max-w-full object-contain" loading="lazy" />
        ) : (
          <div className="text-6xl">📦</div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            wishlist.remove(product.slug);
          }}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-soft grid place-items-center text-lg"
          aria-label="Remover dos favoritos"
        >
          ❤️
        </button>
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <Link href={`/produto/${product.slug}`} className="font-semibold hover:text-becker-purple line-clamp-2 mb-2">
          {product.name}
        </Link>
        <div className="mt-auto">
          {version && (
            <div className="font-extrabold text-lg text-becker-purple mb-2">
              {formatPrice(Number(version.price))}
            </div>
          )}
          <Link
            href={`/produto/${product.slug}`}
            className="block text-center bg-becker-purple text-white text-sm font-semibold py-2 rounded-full hover:bg-becker-purple-deep"
          >
            Ver produto
          </Link>
        </div>
      </div>
    </article>
  );
}
