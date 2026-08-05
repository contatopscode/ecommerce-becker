// ============================================================
// Store de carrinho (Zustand com persistência localStorage)
// Sprint 2: retorna valores computados (não funções) pra reatividade
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  productId: string;
  versionId: string;
  qty: number;
  // cache (populado no fetch)
  name?: string;
  slug?: string;
  image?: string;
  versionLabel?: string;
  price?: number;
  originalPrice?: number | null;
  stock?: number;
  weight?: number;
}

interface CartState {
  items: CartItem[];
  add: (item: CartItem) => void;
  updateQty: (productId: string, versionId: string, qty: number) => void;
  remove: (productId: string, versionId: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const items = get().items;
        const existing = items.find(
          (i) => i.productId === item.productId && i.versionId === item.versionId
        );
        if (existing) {
          set({
            items: items.map((i) =>
              i.productId === item.productId && i.versionId === item.versionId
                ? { ...i, qty: i.qty + item.qty }
                : i
            ),
          });
        } else {
          set({ items: [...items, item] });
        }
      },
      updateQty: (productId, versionId, qty) => {
        if (qty <= 0) {
          set({ items: get().items.filter((i) => !(i.productId === productId && i.versionId === versionId)) });
        } else {
          set({
            items: get().items.map((i) =>
              i.productId === productId && i.versionId === versionId ? { ...i, qty } : i
            ),
          });
        }
      },
      remove: (productId, versionId) => {
        set({ items: get().items.filter((i) => !(i.productId === productId && i.versionId === versionId)) });
      },
      clear: () => set({ items: [] }),
    }),
    { name: 'becker-cart' }
  )
);

// ============ HELPERS (funções puras, fora do store) ============

/** Conta total de itens no carrinho */
export function getCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.qty, 0);
}

/** Subtotal do carrinho (soma de preço * qty) */
export function getSubtotal(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
}

/** Total com frete e desconto aplicados */
export function getTotal(items: CartItem[], shipping = 0, discount = 0): number {
  return Math.max(0, getSubtotal(items) - discount) + shipping;
}

// ============ HOOKS REATIVOS (subscrevem ao items) ============

/** Hook que retorna count e re-renderiza quando items mudam */
export function useCartCount(): number {
  return useCart((s) => getCount(s.items));
}

export function useCartSubtotal(): number {
  return useCart((s) => getSubtotal(s.items));
}

// Toast helper (cliente)
export function toast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('toast-container') || (() => {
    const c = document.createElement('div');
    c.id = 'toast-container';
    c.className = 'fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none';
    document.body.appendChild(c);
    return c;
  })();
  const colors = {
    success: 'bg-eco-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-becker-purple text-white',
  };
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const t = document.createElement('div');
  t.className = `pointer-events-auto ${colors[type]} px-4 py-3 rounded-2xl shadow-pop text-sm font-semibold flex items-center gap-2`;
  t.style.animation = 'fadeIn 0.3s ease';
  t.innerHTML = `<span class="w-6 h-6 rounded-full bg-white/20 grid place-items-center text-xs">${icons[type]}</span><span>${message}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'all 0.3s';
    t.style.opacity = '0';
    t.style.transform = 'translateX(20px)';
    setTimeout(() => t.remove(), 300);
  }, 2800);
}
