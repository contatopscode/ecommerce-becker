'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export function SearchFilters({
  categories,
  activeCategory,
  activeEco,
  activeTop,
  activeNew,
  activeOrdem,
  precoMin,
  precoMax,
}: {
  categories: Category[];
  activeCategory?: string;
  activeEco: boolean;
  activeTop: boolean;
  activeNew: boolean;
  activeOrdem: string;
  precoMin?: string;
  precoMax?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [min, setMin] = useState(precoMin || '');
  const [max, setMax] = useState(precoMax || '');

  // Sincronizar com URL
  useEffect(() => {
    setMin(precoMin || '');
    setMax(precoMax || '');
  }, [precoMin, precoMax]);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/busca?${params.toString()}`);
  };

  const toggleCategory = (slug: string) => {
    updateFilter('categoria', activeCategory === slug ? null : slug);
  };

  const clearAll = () => {
    const q = searchParams.get('q');
    router.push(q ? `/busca?q=${q}` : '/busca');
  };

  return (
    <div className="bg-white rounded-2xl border border-becker-line p-4 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold">Filtros</h2>
        <button
          onClick={clearAll}
          className="text-xs text-becker-purple hover:underline font-semibold"
        >
          Limpar
        </button>
      </div>

      {/* Ordenar por */}
      <div className="mb-5">
        <div className="text-xs font-bold text-becker-slate uppercase mb-2">Ordenar por</div>
        <select
          value={activeOrdem}
          onChange={(e) => updateFilter('ordem', e.target.value)}
          className="w-full border-2 border-becker-line rounded-xl px-3 py-2 text-sm focus:border-becker-purple outline-none"
        >
          <option value="relevante">Relevância</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="rating">Melhor avaliados</option>
          <option value="recent">Mais recentes</option>
        </select>
      </div>

      {/* Categorias */}
      <div className="mb-5">
        <div className="text-xs font-bold text-becker-slate uppercase mb-2">Categoria</div>
        <div className="space-y-1">
          <button
            onClick={() => updateFilter('categoria', null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              !activeCategory ? 'bg-becker-purple text-white' : 'hover:bg-becker-cream'
            }`}
          >
            🛍️ Todas
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleCategory(c.slug)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                activeCategory === c.slug ? 'bg-becker-purple text-white' : 'hover:bg-becker-cream'
              }`}
            >
              <span>{c.icon || '📂'}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div className="mb-5">
        <div className="text-xs font-bold text-becker-slate uppercase mb-2">Tags</div>
        <div className="space-y-1">
          <FilterChip
            active={activeTop}
            onClick={() => updateFilter('top', activeTop ? null : '1')}
            label="🔥 Top"
          />
          <FilterChip
            active={activeNew}
            onClick={() => updateFilter('novo', activeNew ? null : '1')}
            label="✨ Lançamento"
          />
          <FilterChip
            active={activeEco}
            onClick={() => updateFilter('eco', activeEco ? null : '1')}
            label="🌿 Eco"
          />
        </div>
      </div>

      {/* Preço */}
      <div>
        <div className="text-xs font-bold text-becker-slate uppercase mb-2">Preço (R$)</div>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            onBlur={() => updateFilter('precoMin', min || null)}
            className="w-1/2 border-2 border-becker-line rounded-lg px-2 py-1.5 text-sm focus:border-becker-purple outline-none"
          />
          <input
            type="number"
            placeholder="Max"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            onBlur={() => updateFilter('precoMax', max || null)}
            className="w-1/2 border-2 border-becker-line rounded-lg px-2 py-1.5 text-sm focus:border-becker-purple outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 rounded-full text-sm font-semibold border-2 transition ${
        active
          ? 'border-becker-purple bg-becker-purple text-white'
          : 'border-becker-line hover:border-becker-purple/30'
      }`}
    >
      {label}
    </button>
  );
}
