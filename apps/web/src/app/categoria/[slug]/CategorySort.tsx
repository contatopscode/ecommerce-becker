'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function CategorySort({ currentSort }: { currentSort: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={currentSort}
      onChange={(e) => {
        const params = new URLSearchParams(searchParams);
        if (e.target.value === 'recent') params.delete('sort');
        else params.set('sort', e.target.value);
        router.push(`${pathname}?${params.toString()}`);
      }}
      className="bg-white border border-becker-line rounded-full px-4 py-2 text-sm"
    >
      <option value="recent">Mais recentes</option>
      <option value="price-asc">Menor preço</option>
      <option value="price-desc">Maior preço</option>
      <option value="rating">Melhor avaliados</option>
    </select>
  );
}
