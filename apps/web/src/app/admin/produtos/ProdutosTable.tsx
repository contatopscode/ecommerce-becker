'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from '@/lib/cart';

interface Product {
  id: string;
  slug: string;
  name: string;
  sku: string;
  active: boolean;
  isTop: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isEco: boolean;
  rating: number;
  reviewCount: number;
  category: { name: string; slug: string };
  images: Array<{ url: string }>;
  versions: Array<{ price: any; stock: number }>;
  _count: { reviews: number };
}

export function ProdutosTable({ products }: { products: Product[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const toggleFlag = async (id: string, field: 'isTop' | 'isFeatured' | 'isNew' | 'active') => {
    setBusy(id);
    try {
      const res = await fetch('/api/admin/produtos/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, field }),
      });
      const data = await res.json();
      if (data.ok) {
        toast(`${field} atualizado`, 'success');
        router.refresh();
      } else {
        toast(data.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setBusy(null);
  };

  return (
    <div className="bg-white rounded-2xl border border-becker-line overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-becker-cream">
            <tr className="text-left text-becker-slate">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Preço</th>
              <th className="px-4 py-3">Estoque</th>
              <th className="px-4 py-3">Flags</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const minPrice = p.versions.length > 0 ? Math.min(...p.versions.map((v) => Number(v.price))) : 0;
              const totalStock = p.versions.reduce((sum, v) => sum + v.stock, 0);

              return (
                <tr key={p.id} className="border-t border-becker-line">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-becker-cream grid place-items-center overflow-hidden p-1">
                        {p.images[0] ? (
                          <img src={p.images[0].url} alt={p.name} className="max-h-full max-w-full object-contain" />
                        ) : (
                          <span className="text-2xl">📦</span>
                        )}
                      </div>
                      <div>
                        <Link href={`/produto/${p.slug}`} target="_blank" className="font-semibold hover:text-becker-purple line-clamp-1">
                          {p.name}
                        </Link>
                        <div className="text-xs text-becker-slate font-mono">{p.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{p.category.name}</td>
                  <td className="px-4 py-3 font-bold">R$ {minPrice.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={totalStock < 50 ? 'text-amber-600 font-semibold' : 'text-eco-600 font-semibold'}>
                      {totalStock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      <FlagButton
                        active={p.isTop}
                        onClick={() => toggleFlag(p.id, 'isTop')}
                        label="TOP"
                        color="bg-becker-orange"
                        disabled={busy === p.id}
                      />
                      <FlagButton
                        active={p.isFeatured}
                        onClick={() => toggleFlag(p.id, 'isFeatured')}
                        label="DESTAQUE"
                        color="bg-becker-purple"
                        disabled={busy === p.id}
                      />
                      <FlagButton
                        active={p.isNew}
                        onClick={() => toggleFlag(p.id, 'isNew')}
                        label="NOVO"
                        color="bg-eco-500"
                        disabled={busy === p.id}
                      />
                      {p.isEco && (
                        <span className="text-[10px] font-bold bg-eco-100 text-eco-700 px-2 py-0.5 rounded-full">
                          ECO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleFlag(p.id, 'active')}
                      disabled={busy === p.id}
                      className={`text-xs font-bold px-2 py-1 rounded-full ${
                        p.active
                          ? 'bg-eco-100 text-eco-700 hover:bg-eco-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {p.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FlagButton({ active, onClick, label, color, disabled }: { active: boolean; onClick: () => void; label: string; color: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
        active ? `${color} text-white` : 'bg-becker-line text-becker-slate hover:bg-becker-cream'
      }`}
    >
      {label}
    </button>
  );
}
