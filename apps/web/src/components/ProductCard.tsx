// ============================================================
// ProductCard - card de produto reutilizável
// ============================================================

'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCart, toast } from '@/lib/cart';
import { useWishlist } from '@/lib/wishlist';
import { formatPrice } from '@/lib/utils';

interface ProductImage {
  url: string;
  isPrimary: boolean;
}

interface ProductVersion {
  id: string;
  label: string;
  price: any;
  originalPrice: any;
  stock: number;
}

interface ProductCardProps {
  product: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    isEco?: boolean;
    isNew?: boolean;
    isTop?: boolean;
    isFeatured?: boolean;
    rating: number;
    reviewCount: number;
    images: ProductImage[];
    versions: ProductVersion[];
    category?: { slug: string; name: string };
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const cart = useCart();
  const version = product.versions[0];
  const primaryImage = product.images.find((i) => i.isPrimary) || product.images[0];

  const onSale = version?.originalPrice && Number(version.originalPrice) > Number(version.price);
  const discount = onSale
    ? Math.round((1 - Number(version.price) / Number(version.originalPrice)) * 100)
    : 0;

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!version) return;
    cart.add({
      productId: product.id,
      versionId: version.id,
      qty: 1,
      name: product.name,
      slug: product.slug,
      image: primaryImage?.url,
      versionLabel: version.label,
      price: Number(version.price),
      originalPrice: version.originalPrice ? Number(version.originalPrice) : null,
      stock: version.stock,
    });
  };

  // Wishlist
  const wishlist = useWishlist();
  const [isFav, setIsFav] = useState(false);
  useEffect(() => {
    setIsFav(wishlist.has(product.slug));
  }, [wishlist, product.slug]);

  const toggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    wishlist.toggle(product.slug);
    if (isFav) {
      toast('Removido dos favoritos', 'info');
    } else {
      toast('❤️ Adicionado aos favoritos!', 'success');
    }
  };

  return (
    <article className="bg-white rounded-3xl border border-becker-line overflow-hidden group hover:shadow-pop transition flex flex-col">
      <Link href={`/produto/${product.slug}`} className="relative product-img aspect-square grid place-items-center p-4 block overflow-hidden">
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {product.isEco && (
            <span className="bg-eco-500 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
              🌿 ECO
            </span>
          )}
          {product.isTop && (
            <span className={`bg-becker-orange text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${product.isEco ? 'mt-1' : ''}`}>
              TOP
            </span>
          )}
          {product.isNew && (
            <span className="bg-becker-purple text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full mt-1">
              NOVO
            </span>
          )}
          {onSale && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full mt-1">
              -{discount}%
            </span>
          )}
        </div>
        {/* Botão Wishlist */}
        <button
          onClick={toggleFav}
          className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow-soft grid place-items-center text-lg z-10 transition"
          aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          {isFav ? '❤️' : '🤍'}
        </button>

        {/* Imagem */}
        {primaryImage?.url ? (
          <img
            src={primaryImage.url}
            alt={product.name}
            className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
            loading="lazy"
          />
        ) : (
          <div className="text-6xl">📦</div>
        )}
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-[11px] text-becker-slate uppercase tracking-wider font-semibold">
          {product.category?.name}
        </div>
        <Link
          href={`/produto/${product.slug}`}
          className="font-semibold mt-1 line-clamp-2 hover:text-becker-purple"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs text-becker-slate mt-1">
          <span className="text-becker-orange">★</span>
          <span>{product.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{product.reviewCount}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <div className="display font-extrabold text-lg">{formatPrice(Number(version?.price || 0))}</div>
          {onSale && (
            <div className="text-xs text-becker-slate line-through">
              {formatPrice(Number(version.originalPrice))}
            </div>
          )}
        </div>
        <div className="text-[11px] text-eco-600 font-semibold mt-1">
          em até 3x sem juros
        </div>
        <button
          onClick={addToCart}
          className="w-full mt-3 bg-becker-purple hover:bg-becker-purple-deep text-white font-semibold py-2.5 rounded-full transition flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
            <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.5L22 8H6" />
            <circle cx="9" cy="21" r="1.5" />
            <circle cx="18" cy="21" r="1.5" />
          </svg>
          Adicionar
        </button>
      </div>
    </article>
  );
}
