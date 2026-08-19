// ============================================================
// KitCard - card de kit Becker (usado em /kits)
// Mostra: imagem, nome, descrição, preço com desconto, badge
// ============================================================

'use client';

import Link from 'next/link';
import { useCart, toast } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';

interface KitCardProps {
  kit: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    description: string;
    category: string | null;
    image: string | null;
    price: number;
    originalPrice: number;
    discountPercent: number;
    isFeatured: boolean;
    itemCount: number;
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  limpeza: '🧹',
  cozinha: '🍳',
  banheiro: '🚿',
  lavanderia: '👕',
  casa: '🏠',
};

const CATEGORY_LABEL: Record<string, string> = {
  limpeza: 'Limpeza',
  cozinha: 'Cozinha',
  banheiro: 'Banheiro',
  lavanderia: 'Lavanderia',
  casa: 'Casa Completa',
};

export function KitCard({ kit }: KitCardProps) {
  const cart = useCart();
  const savings = kit.originalPrice - kit.price;
  const emoji = CATEGORY_EMOJI[kit.category || ''] || '🎁';
  const label = CATEGORY_LABEL[kit.category || ''] || 'Kit';

  const addKitToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Adiciona o kit como 1 item de carrinho (preço total do kit)
    cart.add({
      productId: kit.id, // usa o id do kit como "productId" (convenção)
      versionId: `kit-${kit.slug}`,
      qty: 1,
      name: kit.name,
      slug: kit.slug,
      image: kit.image || undefined,
      versionLabel: `Kit com ${kit.itemCount} ${kit.itemCount === 1 ? 'item' : 'itens'}`,
      price: kit.price,
      originalPrice: kit.originalPrice,
      stock: 99, // kits não tem estoque limitado
      // Campo extra pra identificar que é kit
      isKit: true,
    } as any);
    toast(`🎁 ${kit.name} adicionado!`, 'success');
  };

  return (
    <Link
      href={`/kits/${kit.slug}`}
      className="bg-white rounded-3xl border-2 border-becker-line overflow-hidden group hover:border-becker-purple hover:shadow-pop transition flex flex-col relative"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {kit.isFeatured && (
          <span className="bg-becker-orange text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full shadow-soft">
            ⭐ Destaque
          </span>
        )}
        <span className="bg-eco-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-soft">
          -{kit.discountPercent}% OFF
        </span>
      </div>

      {/* Imagem / Hero */}
      <div className="aspect-square bg-gradient-to-br from-becker-purple/10 to-becker-orange/10 grid place-items-center relative overflow-hidden">
        <div className="text-8xl">{emoji}</div>
        <div className="absolute bottom-2 right-2 bg-white/90 text-becker-slate text-[10px] font-bold px-2 py-1 rounded-full">
          {label}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-extrabold text-lg mb-1 line-clamp-1">{kit.name}</h3>
        <p className="text-sm text-becker-slate line-clamp-2 mb-3 flex-1">
          {kit.shortDescription || kit.description.substring(0, 100) + '...'}
        </p>

        <div className="text-xs text-becker-slate mb-2">
          📦 {kit.itemCount} {kit.itemCount === 1 ? 'produto' : 'produtos'}
        </div>

        {/* Preços */}
        <div className="flex items-end gap-2 mb-3">
          <div className="text-2xl font-extrabold text-becker-purple">
            {formatPrice(kit.price)}
          </div>
          {kit.originalPrice > kit.price && (
            <div className="text-sm text-becker-slate line-through mb-0.5">
              {formatPrice(kit.originalPrice)}
            </div>
          )}
        </div>
        {savings > 0 && (
          <div className="text-xs text-eco-600 font-semibold mb-3">
            💰 Você economiza {formatPrice(savings)}
          </div>
        )}

        <button
          onClick={addKitToCart}
          className="w-full bg-becker-orange hover:brightness-95 transition text-white font-bold py-3 rounded-full text-sm shadow-pop"
        >
          🛒 Adicionar kit
        </button>
      </div>
    </Link>
  );
}
