// ============================================================
// Header (com search + cart badge)
// ============================================================

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { SearchBox } from '@/components/SearchBox';

const CATEGORY_NAV = [
  { slug: 'lava-roupas', label: 'Lava Roupas' },
  { slug: 'multiuso', label: 'Multiuso' },
  { slug: 'desinfetantes', label: 'Desinfetantes' },
  { slug: 'alcool', label: 'Álcool' },
  { slug: 'eco', label: '🌿 Eco' },
  { slug: 'pro', label: 'Becker PRO' },
];

export function Header() {
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const count = useCart((s) => s.items.reduce((sum, i) => sum + i.qty, 0));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/busca?q=${encodeURIComponent(search.trim())}`);
    }
  };

  // Esconde header no checkout (tela cheia)
  if (pathname === '/checkout') return null;

  return (
    <>
      <div className="bg-becker-purple text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-eco-500 text-white px-2 py-0.5 rounded-full font-semibold text-[10px]">
              🌿 ECO
            </span>
            <span className="opacity-90 hidden sm:inline">
              Linha 100% biodegradável · 🚚 Frete grátis para todo o Brasil
            </span>
            <span className="opacity-90 sm:hidden">Frete grátis BR</span>
          </div>
          <div className="hidden md:flex items-center gap-4 opacity-90">
            <Link href="/rastrear" className="hover:underline">Rastrear pedido</Link>
            <Link href="/atendimento" className="hover:underline">Atendimento</Link>
            <Link href="/empresas" className="hover:underline">Para empresas</Link>
          </div>
        </div>
      </div>

      <header className="sticky top-0 z-40 glass border-b border-becker-line">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 -ml-2"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-10 h-10 rounded-2xl gradient-purple grid place-items-center shadow-soft">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
                <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth={2} />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div className="leading-none">
              <div className="display font-extrabold text-xl text-becker-purple">Becker</div>
              <div className="text-[10px] uppercase tracking-widest text-becker-slate hidden sm:block">
                Linha Doméstica
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-6 text-sm font-medium">
            {CATEGORY_NAV.map((c) => (
              <Link
                key={c.slug}
                href={`/categoria/${c.slug}`}
                className="px-3 py-2 rounded-lg hover:bg-becker-purple-soft text-becker-ink"
              >
                {c.label}
              </Link>
            ))}
            <Link
              href="/ofertas"
              className="px-3 py-2 rounded-lg text-becker-orange font-semibold"
            >
              Ofertas 🔥
            </Link>
          </nav>

          <SearchBox />

          <div className="flex items-center gap-1">
            <Link
              href="/conta"
              className="hidden sm:flex p-2.5 rounded-full hover:bg-becker-purple-soft"
              aria-label="Conta"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" />
              </svg>
            </Link>
            <Link
              href="/carrinho"
              className="p-2.5 rounded-full hover:bg-becker-purple-soft relative"
              aria-label="Carrinho"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M3 4h2l2.4 12.2a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.5L22 8H6" />
                <circle cx="9" cy="21" r="1.5" />
                <circle cx="18" cy="21" r="1.5" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-becker-orange text-white text-[10px] font-bold rounded-full grid place-items-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-becker-line bg-white">
            <nav className="px-4 py-3 grid gap-1">
              {CATEGORY_NAV.map((c) => (
                <Link
                  key={c.slug}
                  href={`/categoria/${c.slug}`}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-lg hover:bg-becker-purple-soft text-sm font-medium"
                >
                  {c.label}
                </Link>
              ))}
              <Link href="/ofertas" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-becker-orange font-semibold text-sm">
                Ofertas 🔥
              </Link>
              <hr className="my-2" />
              <Link href="/conta" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm">Minha conta</Link>
              <Link href="/rastrear" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm">Rastrear pedido</Link>
              <Link href="/atendimento" onClick={() => setMenuOpen(false)} className="px-3 py-2.5 rounded-lg text-sm">Atendimento</Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
