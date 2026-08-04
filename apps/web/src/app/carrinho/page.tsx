// ============================================================
// Carrinho
// ============================================================

'use client';

import Link from 'next/link';
import { useCart, toast } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const cart = useCart();
  const items = cart.items;
  const subtotal = cart.subtotal();
  const freeShipping = subtotal >= 199;
  const remaining = 199 - subtotal;

  if (items.length === 0) {
    return (
      <main className="min-h-[60vh] grid place-items-center px-4">
        <div className="text-center py-16">
          <div className="text-7xl mb-4">🛒</div>
          <h1 className="display text-2xl lg:text-3xl font-extrabold mb-2">Seu carrinho está vazio</h1>
          <p className="text-becker-slate mb-6">Que tal explorar nossas categorias?</p>
          <Link href="/" className="inline-block bg-becker-purple text-white font-semibold px-6 py-3 rounded-full">
            Ver produtos
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="display text-3xl font-extrabold mb-6">Seu carrinho ({cart.count()})</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.versionId}`} className="bg-white rounded-2xl border border-becker-line p-4 flex gap-4">
              <Link href={`/produto/${item.slug}`} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-becker-purple-soft grid place-items-center shrink-0 overflow-hidden p-1">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-becker-slate uppercase font-semibold">{item.versionLabel}</div>
                <Link href={`/produto/${item.slug}`} className="font-semibold hover:text-becker-purple block truncate">
                  {item.name}
                </Link>
                <div className="text-xs text-becker-slate">{formatPrice(item.price || 0)} cada</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border border-becker-line rounded-full">
                    <button
                      onClick={() => cart.updateQty(item.productId, item.versionId, item.qty - 1)}
                      className="w-8 h-8 grid place-items-center hover:bg-purple-50"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      onClick={() => cart.updateQty(item.productId, item.versionId, item.qty + 1)}
                      className="w-8 h-8 grid place-items-center hover:bg-purple-50"
                    >
                      +
                    </button>
                  </div>
                  <div className="font-bold text-becker-purple">
                    {formatPrice((item.price || 0) * item.qty)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  cart.remove(item.productId, item.versionId);
                  toast('Produto removido', 'info');
                }}
                className="text-becker-slate hover:text-red-500 self-start"
                aria-label="Remover"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        <aside className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-becker-line p-6 sticky top-20">
            <h3 className="display text-lg font-extrabold mb-4">Resumo</h3>
            <div className="space-y-2 text-sm border-b border-becker-line pb-3 mb-3">
              <div className="flex justify-between">
                <span className="text-becker-slate">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-becker-slate">Frete</span>
                <span className="text-eco-600 font-semibold">Grátis</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-semibold">Total</span>
              <span className="display text-2xl font-extrabold text-becker-purple">{formatPrice(subtotal)}</span>
            </div>
            {!freeShipping && remaining > 0 && (
              <div className="text-xs text-becker-slate mt-2">
                Faltam <strong className="text-eco-600">{formatPrice(remaining)}</strong> para frete grátis
              </div>
            )}
            <Link
              href="/checkout"
              className="w-full mt-5 bg-becker-orange hover:brightness-95 transition text-white font-bold py-4 rounded-full text-lg shadow-pop inline-block text-center"
            >
              Finalizar pedido
            </Link>
            <div className="text-xs text-eco-600 font-semibold text-center mt-2">✓ Frete grátis incluso</div>
            <Link href="/" className="block text-center text-sm text-becker-purple font-semibold mt-3 hover:underline">
              ← Continuar comprando
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
