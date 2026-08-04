// ============================================================
// ProductClient - parte interativa da página de produto
// ============================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart, toast } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { calcShippingAction } from '@/lib/actions';

interface ProductVersion {
  id: string;
  label: string;
  price: any;
  originalPrice: any;
  stock: number;
  weight: number;
  sku: string;
}

interface ProductImage {
  url: string;
  isPrimary: boolean;
  alt: string | null;
}

interface Props {
  product: {
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    isEco: boolean;
    isNew: boolean;
    isTop: boolean;
    rating: number;
    reviewCount: number;
    images: ProductImage[];
    versions: ProductVersion[];
    category: { name: string; slug: string };
  };
}

export function ProductClient({ product }: Props) {
  const cart = useCart();
  const [selectedVersion, setSelectedVersion] = useState(product.versions[0]);
  const [qty, setQty] = useState(1);
  const [cep, setCep] = useState('');
  const [shipping, setShipping] = useState<{ price: number; days: string; carrier: string } | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const onSale = selectedVersion.originalPrice && Number(selectedVersion.originalPrice) > Number(selectedVersion.price);
  const disc = onSale ? Math.round((1 - Number(selectedVersion.price) / Number(selectedVersion.originalPrice)) * 100) : 0;
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5581999022262';

  const addToCart = () => {
    cart.add({
      productId: product.id,
      versionId: selectedVersion.id,
      qty,
      name: product.name,
      slug: product.slug,
      image: product.images[0]?.url,
      versionLabel: selectedVersion.label,
      price: Number(selectedVersion.price),
      originalPrice: selectedVersion.originalPrice ? Number(selectedVersion.originalPrice) : null,
      stock: selectedVersion.stock,
    });
  };

  const buyNow = () => {
    addToCart();
    window.location.href = '/checkout';
  };

  const calcCep = async () => {
    if (cep.replace(/\D/g, '').length !== 8) {
      toast('Digite um CEP válido', 'error');
      return;
    }
    setLoadingShipping(true);
    try {
      const options = await calcShippingAction(cep, 0); // valor simulado só pra mostrar opções
      setShipping({ price: options[0]?.price || 0, days: options[0]?.days || '', carrier: options[0]?.carrier || 'Correios' });
      toast('Frete calculado!', 'success');
    } catch (e) {
      toast('Erro ao calcular frete', 'error');
    }
    setLoadingShipping(false);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 pb-16 grid lg:grid-cols-2 gap-10">
      {/* Galeria */}
      <div>
        <div className="product-img rounded-3xl aspect-square grid place-items-center relative p-6 overflow-hidden">
          {product.isEco && (
            <span className="absolute top-5 left-5 bg-eco-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full z-10">
              🌿 ECO
            </span>
          )}
          {product.isNew && (
            <span className={`absolute top-5 ${product.isEco ? 'left-24' : 'left-5'} bg-becker-purple text-white text-xs font-bold uppercase px-3 py-1 rounded-full z-10`}>
              NOVO
            </span>
          )}
          {onSale && (
            <span className="absolute top-5 right-16 bg-becker-orange text-white text-xs font-bold uppercase px-3 py-1 rounded-full z-10">
              -{disc}% OFF
            </span>
          )}
          <button
            className="absolute top-5 right-5 w-10 h-10 grid place-items-center rounded-full bg-white shadow text-becker-slate z-10"
            aria-label="Favoritar"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.6Z" />
            </svg>
          </button>
          {product.images[activeImage] ? (
            <img
              src={product.images[activeImage].url}
              alt={product.name}
              className="max-h-[80%] max-w-[80%] object-contain"
            />
          ) : (
            <div className="text-8xl">📦</div>
          )}
        </div>
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3 mt-4">
            {product.images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`product-img rounded-2xl aspect-square grid place-items-center border-2 p-2 overflow-hidden transition ${
                  i === activeImage ? 'border-becker-purple' : 'border-transparent hover:border-becker-purple/40'
                }`}
              >
                <img src={img.url} alt={img.alt || ''} className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="text-xs font-bold uppercase tracking-widest text-becker-orange">
          {product.category.name}
        </div>
        <h1 className="display text-3xl lg:text-4xl font-extrabold mt-2">{product.name}</h1>
        <div className="flex items-center gap-2 mt-2 text-sm">
          <span className="text-becker-orange">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
          <span className="text-becker-slate">({product.reviewCount} avaliações)</span>
        </div>

        <div className="mt-6 flex items-end gap-3">
          <div className="display text-4xl font-extrabold">{formatPrice(Number(selectedVersion.price))}</div>
          {onSale && (
            <div className="text-becker-slate line-through mb-1">{formatPrice(Number(selectedVersion.originalPrice))}</div>
          )}
          {onSale && <span className="bg-becker-orange/10 text-becker-orange text-xs font-bold px-2 py-1 rounded-full mb-1">-{disc}%</span>}
        </div>
        <div className="text-sm text-eco-600 font-semibold mt-1">
          em até 3x de {formatPrice(Number(selectedVersion.price) / 3)} sem juros
        </div>

        {/* Versões */}
        {product.versions.length > 1 && (
          <div className="mt-7">
            <div className="text-sm font-semibold mb-2">
              Versão: <span className="text-becker-orange">{selectedVersion.label}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.versions.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
                    v.id === selectedVersion.id
                      ? 'border-becker-purple bg-becker-purple/5'
                      : 'border-becker-line hover:border-becker-purple'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantidade */}
        <div className="mt-6 flex items-center gap-4">
          <span className="text-sm font-semibold">Quantidade:</span>
          <div className="flex items-center border border-becker-line rounded-full">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 grid place-items-center hover:bg-purple-50">−</button>
            <span className="w-10 text-center font-semibold">{qty}</span>
            <button onClick={() => setQty(qty + 1)} className="w-10 h-10 grid place-items-center hover:bg-purple-50">+</button>
          </div>
          <span className="text-xs text-becker-slate">📦 {selectedVersion.stock} em estoque</span>
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
            onClick={addToCart}
            className="bg-becker-purple hover:bg-becker-purple-deep transition text-white font-bold py-4 rounded-full text-lg"
          >
            🛒 Adicionar ao carrinho
          </button>
        </div>
        <a
          href={`https://wa.me/${phone}?text=${encodeURIComponent('Olá! Tenho interesse no produto: ' + product.name)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 w-full bg-green-500 hover:bg-green-600 transition text-white font-semibold py-3 rounded-full flex items-center justify-center gap-2"
        >
          💬 Pedir pelo WhatsApp
        </a>

        <div className="mt-7 grid grid-cols-3 gap-3 text-center">
          <div className="bg-white rounded-2xl p-3 border border-becker-line">
            <div className="text-xl">🚚</div>
            <div className="text-xs font-semibold mt-1">Frete grátis</div>
            <div className="text-[10px] text-becker-slate">acima R$ 199</div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-becker-line">
            <div className="text-xl">↩️</div>
            <div className="text-xs font-semibold mt-1">7 dias</div>
            <div className="text-[10px] text-becker-slate">pra trocar</div>
          </div>
          <div className="bg-white rounded-2xl p-3 border border-becker-line">
            <div className="text-xl">🔒</div>
            <div className="text-xs font-semibold mt-1">Pagamento</div>
            <div className="text-[10px] text-becker-slate">100% seguro</div>
          </div>
        </div>

        {/* CEP */}
        <div className="mt-6 bg-white rounded-2xl border border-becker-line p-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">📍</span>
            <div className="flex-1">
              <div className="text-xs text-becker-slate">Calcular frete e prazo</div>
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
    </main>
  );
}
