// ============================================================
// Wishlist (favoritos) - Sprint 5
// Usa localStorage pra funcionar mesmo deslogado
// Sincroniza com DB quando logado (futuro)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistState {
  items: string[]; // array de product slugs
  add: (slug: string) => void;
  remove: (slug: string) => void;
  toggle: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (slug) => set({ items: Array.from(new Set([...get().items, slug])) }),
      remove: (slug) => set({ items: get().items.filter((s) => s !== slug) }),
      toggle: (slug) => {
        const items = get().items;
        if (items.includes(slug)) {
          set({ items: items.filter((s) => s !== slug) });
        } else {
          set({ items: [...items, slug] });
        }
      },
      has: (slug) => get().items.includes(slug),
      clear: () => set({ items: [] }),
    }),
    { name: 'becker-wishlist' }
  )
);

/** Hook reativo: conta itens */
export function useWishlistCount(): number {
  return useWishlist((s) => s.items.length);
}
