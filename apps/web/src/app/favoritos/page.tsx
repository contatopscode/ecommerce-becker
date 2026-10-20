import Link from 'next/link';
// ============================================================
// Página de Favoritos (Wishlist)
// Sprint 5: produtos marcados com ❤️ na home/categoria
// ============================================================

import { PageShell } from '@/components/PageShell';
import { WishlistGrid } from './WishlistGrid';

export const dynamic = 'force-dynamic';

export default async function FavoritosPage() {
  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-sm text-becker-slate mb-4">
          <Link href="/" className="hover:underline">Home</Link> › <span className="text-becker-ink font-medium">Favoritos</span>
        </div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="display text-3xl lg:text-4xl font-extrabold">❤️ Meus favoritos</h1>
        </div>

        <WishlistGrid />
      </div>
    </PageShell>
  );
}
