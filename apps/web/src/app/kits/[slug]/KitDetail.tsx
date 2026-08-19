// ============================================================
// KitDetail - parte interativa da página /kits/[slug]
// Mostra itens, calcula frete, botão de compra
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart, toast } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { calcShippingAction } from '@/lib/actions';

interface KitItem {
  productId: string;
  productSlug?: string;
  productName: string;
  image?: string;
  versionLabel: string | null;
  qty: number;
}

interface KitDetailProps {
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
    items: KitItem[];
  };
}

const CATEGORY_EMOJI: Record<string, string> = {
  limpeza: '🧹',
  cozinha: '🍳',
  banheiro: '🚿',
  lavanderia: '👕',
  casa: '🏠',
};

export function KitDetail({ kit }: KitDetailProps) {
  const cart = useCart();
  const [cep, setCep] = useState('');
  const [shipping, setShipping] = useState<{ price: number; days: string; carrier: string } | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);

  const savings = kit.originalPrice - kit.price;
  const emoji = CATEGORY_EMOJI[kit.category || ''] || '🎁';

  const addKitToCart = () => {
    cart.add({
      productId: kit.id,
      versionId: `kit-${kit.slug}`,
      qty: 1,
      name: kit.name,
      slug: kit.slug,
      image: kit.image || undefined,
      versionLabel: `Kit com ${kit.items.length} produtos`,
      price: kit.price,
      originalPrice: kit.originalPrice,
      stock: 99,
      isKit: true,
    } as any);
    toast(`🎁 ${kit.name} adicionado ao carrinho!`, 'success');
  };

  const buyNow = () => {
    addKitToCart();
    window.location.href = '/checkout';
  };

  const calcCep = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast('Digite um CEP válido', 'error');
      return;
    }
    setLoadingShipping(true);
    try {
      // Estimar peso médio: ~1kg por item
      const estimatedWeight = kit.items.length;
      const options = await calcShippingAction(cep, kit.price);
      if (options && options.length > 0) {
        setShipping({
          price: options[0]?.price || 0,
          days: options[0]?.days || '',
          carrier: options[0]?.carrier || 'Correios',
        });
        toast('Frete calculado!', 'success');
      } else {
        toast('Não foi possível calcular o frete', 'error');
      }
    } catch (e) {
      toast('Erro ao calcular frete', 'error');
    }
    setLoadingShipping(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-becker-slate mb-6">
        <Link href="/" className="hover:underline">Home</Link> ›{' '}
        <Link href="/kits" className="hover:underline">Kits</Link> ›{' '}
        <span className="text-becker-ink font-medium">{kit.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-10">
        {/* Hero / Visual */}
        <div className="bg-gradient-to-br from-becker-purple/10 to-becker-orange/10 rounded-3xl aspect-square grid place-items-center relative overflow-hidden">
          {kit.isFeatured && (
            <span className="absolute top-5 left-5 bg-becker-orange text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-pop z-10">
              ⭐ Destaque
            </span>
          )}
          <span className="absolute top-5 right-5 bg-eco-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-pop z-10">
            -{kit.discountPercent}% OFF
          </span>
          <div className="text-[180px]">{emoji}</div>
        </div>

        {/* Info */}
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-becker-orange mb-2">
            Kit Becker
          </div>
          <h1 className="display text-3xl lg:text-4xl font-extrabold mb-3">{kit.name}</h1>
          {kit.shortDescription && (
            <p className="text-becker-slate text-lg mb-4">{kit.shortDescription}</p>
          )}

          {/* Preço */}
          <div className="mt-6 flex items-end gap-3 mb-2">
            <div className="display text-4xl font-extrabold text-becker-purple">
              {formatPrice(kit.price)}
            </div>
            {kit.originalPrice > kit.price && (
              <div className="text-becker-slate line-through mb-1">
                {formatPrice(kit.originalPrice)}
              </div>
            )}
          </div>
          {savings > 0 && (
            <div className="text-eco-600 font-semibold text-sm">
              💰 Você economiza {formatPrice(savings)} ({kit.discountPercent}% OFF)
            </div>
          )}
          <div className="text-sm text-becker-slate mt-2">
            em até 3x de {formatPrice(kit.price / 3)} sem juros
          </div>

          {/* CTAs */}
          <div className="mt-6 grid sm:grid-cols-2 gap-3">
            <button
              onClick={buyNow}
              className="bg-becker-orange hover:brightness-95 transition text-white font-bold py-4 rounded-full text-lg shadow-pop"
            >
              Comprar agora
            </button>
            <button
              onClick={addKitToCart}
              className="bg-becker-purple hover:bg-becker-purple-deep transition text-white font-bold py-4 rounded-full text-lg"
            >
              🛒 Adicionar ao carrinho
            </button>
          </div>

          {/* CEP */}
          <div className="mt-6 bg-white rounded-2xl border border-becker-line p-4">
            <div className="flex items-center gap-3">
              <span className="text-xl">📍</span>
              <div className="flex-1">
                <div className="text-xs text-becker-slate">Calcular frete</div>
                <input
                  value={cep}
                  onChange={(e) => setCep(e.target.value.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2'))}
                  placeholder="00000-000"
                  className="w-full text-sm focus:outline-none mt-1"
                  maxLength={9}
                />
              </div>
              <button
                onClick={calcCep}
                disabled={loadingShipping}
                className="text-becker-purple font-semibold text-sm disabled:opacity-50"
              >
                {loadingShipping ? 'Calculando...' : 'Calcular'}
              </button>
            </div>
            {shipping && (
              <div className="text-xs text-becker-slate mt-2 pt-2 border-t border-becker-line">
                ✓ {shipping.carrier} · {shipping.days} ·{' '}
                {shipping.price === 0 ? (
                  <span className="text-eco-600 font-semibold">Grátis</span>
                ) : (
                  formatPrice(shipping.price)
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Itens do kit */}
      <section className="mt-12">
        <h2 className="display text-2xl font-extrabold mb-6">
          O que vem no kit ({kit.items.length}{' '}
          {kit.items.length === 1 ? 'produto' : 'produtos'})
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kit.items.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-becker-line p-4 flex items-center gap-4"
            >
              <div className="w-16 h-16 bg-becker-cream rounded-xl grid place-items-center overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.productName} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm line-clamp-2">{item.productName}</div>
                {item.versionLabel && (
                  <div className="text-xs text-becker-slate mt-0.5">{item.versionLabel}</div>
                )}
                <div className="text-xs text-becker-orange font-semibold mt-1">
                  Qtd: {item.qty}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Descrição completa */}
      <section className="mt-12 bg-white rounded-3xl border border-becker-line p-8">
        <h2 className="display text-2xl font-extrabold mb-3">Sobre o kit</h2>
        <p className="text-becker-ink leading-relaxed whitespace-pre-line">{kit.description}</p>
      </section>

      {/* Trust badges */}
      <section className="mt-8 grid grid-cols-3 gap-3 text-center">
        <div className="bg-white rounded-2xl p-4 border border-becker-line">
          <div className="text-2xl">🚚</div>
          <div className="text-xs font-semibold mt-1">Frete grátis</div>
          <div className="text-[10px] text-becker-slate">acima R$ 199</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-becker-line">
          <div className="text-2xl">↩️</div>
          <div className="text-xs font-semibold mt-1">7 dias</div>
          <div className="text-[10px] text-becker-slate">pra trocar</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-becker-line">
          <div className="text-2xl">🔒</div>
          <div className="text-xs font-semibold mt-1">Pagamento</div>
          <div className="text-[10px] text-becker-slate">100% seguro</div>
        </div>
      </section>
    </div>
  );
}
