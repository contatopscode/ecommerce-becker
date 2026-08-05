'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface SearchResult {
  products: Array<{
    id: string;
    slug: string;
    name: string;
    shortDescription: string | null;
    image: string | null;
    price: number | null;
  }>;
  categories: Array<{
    id: string;
    slug: string;
    name: string;
    icon: string | null;
    color: string | null;
  }>;
  total: number;
}

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({ products: [], categories: [], total: 0 });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Buscar com debounce
  useEffect(() => {
    if (query.length < 2) {
      setResults({ products: [], categories: [], total: 0 });
      setOpen(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        if (data.ok) {
          setResults(data);
          setOpen(true);
          setHighlight(-1);
        }
      } catch (e) {
        console.error('Search error:', e);
      }
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/busca?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === 'Enter' && highlight >= 0) {
      e.preventDefault();
      const p = results.products[highlight];
      router.push(`/produto/${p.slug}`);
      setOpen(false);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="flex-1 max-w-xl ml-auto relative">
      <form onSubmit={handleSubmit}>
        <label className="relative block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-becker-slate pointer-events-none">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setOpen(true)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="Buscar produtos..."
            className="w-full bg-white border border-becker-line rounded-full pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-becker-purple/30 focus:border-becker-purple"
          />
          {loading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-becker-purple border-t-transparent rounded-full animate-spin" />
            </span>
          )}
        </label>
      </form>

      {/* Dropdown de resultados */}
      {open && results.total > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl border border-becker-line shadow-pop overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {/* Categorias */}
          {results.categories.length > 0 && (
            <div className="p-2 border-b border-becker-line">
              <div className="text-[10px] uppercase tracking-wider text-becker-slate font-semibold px-3 py-1">
                Categorias
              </div>
              {results.categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categoria/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-becker-cream"
                >
                  <span
                    className="w-8 h-8 rounded-lg grid place-items-center text-lg"
                    style={{ background: c.color ? `${c.color}20` : '#F3F0FF' }}
                  >
                    {c.icon || '📂'}
                  </span>
                  <span className="font-semibold text-sm">{c.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Produtos */}
          {results.products.length > 0 && (
            <div className="p-2">
              <div className="text-[10px] uppercase tracking-wider text-becker-slate font-semibold px-3 py-1">
                Produtos
              </div>
              {results.products.map((p, idx) => (
                <Link
                  key={p.id}
                  href={`/produto/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                    highlight === idx ? 'bg-becker-purple-soft' : 'hover:bg-becker-cream'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg bg-becker-cream grid place-items-center overflow-hidden p-0.5 shrink-0">
                    {p.image ? (
                      <img src={p.image} alt="" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <span className="text-lg">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm line-clamp-1">{p.name}</div>
                    {p.shortDescription && (
                      <div className="text-[10px] text-becker-slate line-clamp-1">{p.shortDescription}</div>
                    )}
                  </div>
                  {p.price && (
                    <div className="text-sm font-bold text-becker-purple shrink-0">
                      {formatPrice(p.price)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Footer: ver todos */}
          <button
            onClick={handleSubmit}
            className="block w-full text-center text-sm font-semibold text-becker-purple hover:bg-becker-cream py-3 border-t border-becker-line"
          >
            Ver todos os resultados para "{query}" →
          </button>
        </div>
      )}

      {/* Empty state */}
      {open && !loading && query.length >= 2 && results.total === 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl border border-becker-line shadow-pop p-6 text-center z-50">
          <div className="text-3xl mb-2">🤷</div>
          <p className="text-sm text-becker-slate">Nenhum produto encontrado para "{query}"</p>
        </div>
      )}
    </div>
  );
}
