'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  sku: string | null;
  category: { name: string; slug: string; id: string };
  active: boolean;
  isTop: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isEco: boolean;
  rating: number;
  images: Array<{ id: string; url: string; isCover: boolean; isPrimary: boolean }>;
  versions: Array<{ id: string; label: string; sku: string; price: number; stock: number; weight: number | null }>;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface Props {
  initialProducts: Product[];
  categories: Category[];
}

export function ProdutosClient({ initialProducts, categories }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  // Atualiza quando products iniciais mudam (refresh)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const filtered = products.filter((p) =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
    p.category.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async (data: any, isNew: boolean) => {
    setBusy(true);
    try {
      const url = isNew ? '/api/admin/produtos' : `/api/admin/produtos/${data.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.ok) {
        toast(isNew ? 'Produto criado ✓' : 'Produto atualizado ✓', 'success');
        setEditing(null);
        setCreating(false);
        router.refresh();
      } else {
        toast(result.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setBusy(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que quer deletar "${name}"?\n\nOs pedidos com esse produto NÃO serão afetados (snapshot do nome).`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        toast('Produto deletado', 'success');
        router.refresh();
      } else {
        toast(data.error || 'Erro', 'error');
      }
    } catch {
      toast('Erro de conexão', 'error');
    }
    setBusy(null as any);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar por nome, SKU ou categoria..."
          className="flex-1 max-w-md border-2 border-becker-line rounded-xl px-4 py-2 focus:border-becker-purple outline-none"
        />
        <button
          onClick={() => setCreating(true)}
          className="bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full text-sm shrink-0"
        >
          + Novo produto
        </button>
      </div>

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
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const minPrice = p.versions.length > 0 ? Math.min(...p.versions.map((v) => Number(v.price))) : 0;
                const totalStock = p.versions.reduce((sum, v) => sum + (v.stock || 0), 0);

                return (
                  <tr key={p.id} className="border-t border-becker-line">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-becker-cream grid place-items-center overflow-hidden p-0.5 shrink-0">
                          {p.images[0]?.url ? (
                            <img src={p.images[0].url} alt="" className="max-h-full max-w-full object-contain" />
                          ) : (
                            <span className="text-lg">📦</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold line-clamp-1">{p.name}</div>
                          <div className="text-xs text-becker-slate font-mono">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs">{p.category.name}</td>
                    <td className="px-4 py-3 font-bold">{formatPrice(minPrice)}</td>
                    <td className="px-4 py-3">
                      <span className={totalStock < 50 ? 'text-amber-600 font-semibold' : 'text-eco-600 font-semibold'}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.isTop && <span className="text-[10px] font-bold bg-becker-orange text-white px-1.5 py-0.5 rounded">TOP</span>}
                        {p.isFeatured && <span className="text-[10px] font-bold bg-becker-purple text-white px-1.5 py-0.5 rounded">DESTAQUE</span>}
                        {p.isNew && <span className="text-[10px] font-bold bg-eco-500 text-white px-1.5 py-0.5 rounded">NOVO</span>}
                        {p.isEco && <span className="text-[10px] font-bold bg-eco-100 text-eco-700 px-1.5 py-0.5 rounded">ECO</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        p.active ? 'bg-eco-100 text-eco-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(p)}
                          className="text-xs text-becker-purple hover:underline font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={busy === p.id as any}
                          className="text-xs text-red-600 hover:underline font-semibold disabled:opacity-50"
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-becker-slate">
            {search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
          </div>
        )}
      </div>

      {/* Modal de edição/criação */}
      {(editing || creating) && (
        <ProductModal
          product={editing}
          categories={categories}
          onSave={handleSave}
          onClose={() => { setEditing(null); setCreating(false); }}
          busy={busy === true}
        />
      )}
    </>
  );
}

function ProductModal({ product, categories, onSave, onClose, busy }: {
  product: Product | null;
  categories: Category[];
  onSave: (data: any, isNew: boolean) => void;
  onClose: () => void;
  busy: boolean;
}) {
  const isNew = !product;
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [description, setDescription] = useState(product?.description || '');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [categoryId, setCategoryId] = useState(product?.category.id || categories[0]?.id || '');
  const [active, setActive] = useState(product?.active ?? true);
  const [isTop, setIsTop] = useState(product?.isTop ?? false);
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false);
  const [isNewFlag, setIsNewFlag] = useState(product?.isNew ?? false);
  const [isEco, setIsEco] = useState(product?.isEco ?? false);
  const [imageUrl, setImageUrl] = useState(product?.images[0]?.url || '');
  const [versionLabel, setVersionLabel] = useState(product?.versions[0]?.label || '');
  const [versionPrice, setVersionPrice] = useState(product?.versions[0]?.price?.toString() || '');
  const [versionStock, setVersionStock] = useState(product?.versions[0]?.stock?.toString() || '0');
  const [versionWeight, setVersionWeight] = useState(product?.versions[0]?.weight?.toString() || '500');

  // Auto-gerar slug a partir do nome
  useEffect(() => {
    if (isNew && name && !slug) {
      setSlug(name.toLowerCase()
        .replace(/[áàã]/g, 'a').replace(/[éê]/g, 'e').replace(/[íì]/g, 'i')
        .replace(/[óôõ]/g, 'o').replace(/[úù]/g, 'u').replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
    }
  }, [name, isNew, slug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug || !categoryId) {
      toast('Preencha nome, slug e categoria', 'error');
      return;
    }
    onSave({
      id: product?.id,
      name,
      slug,
      description,
      shortDescription,
      sku: sku || `BK-${slug.slice(0, 15).toUpperCase()}`,
      categoryId,
      active,
      isTop,
      isFeatured,
      isNew: isNewFlag,
      isEco,
      imageUrl,
      version: {
        label: versionLabel || name,
        price: parseFloat(versionPrice) || 0,
        stock: parseInt(versionStock) || 0,
        weight: parseInt(versionWeight) || 500,
        sku: sku || `BK-${slug.slice(0, 15).toUpperCase()}`,
      },
    }, isNew);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
        <h2 className="text-2xl font-extrabold mb-4">
          {isNew ? 'Novo produto' : `Editar: ${product?.name}`}
        </h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">Nome *</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Slug *</label>
            <input
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className="w-full border-2 border-becker-line rounded-xl px-3 py-2 font-mono text-sm focus:border-becker-purple outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">Descrição curta</label>
            <input
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Frase de impacto pro card"
              className="w-full border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">Descrição completa</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">SKU</label>
            <input
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="BK-XXXXX"
              className="w-full border-2 border-becker-line rounded-xl px-3 py-2 font-mono text-sm focus:border-becker-purple outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Categoria *</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full border-2 border-becker-line rounded-xl px-3 py-2 focus:border-becker-purple outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-1">URL da imagem</label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/img/products/limpador-500ml.jpeg"
              className="w-full border-2 border-becker-line rounded-xl px-3 py-2 font-mono text-xs focus:border-becker-purple outline-none"
            />
            {imageUrl && (
              <div className="mt-2 w-20 h-20 bg-becker-cream rounded-lg p-1">
                <img src={imageUrl} alt="" className="max-h-full max-w-full object-contain mx-auto" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 border-t border-becker-line pt-4 mt-2">
            <h3 className="font-bold mb-3">Versão de venda</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1">Label</label>
                <input
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="500ml Original"
                  className="w-full border-2 border-becker-line rounded-xl px-3 py-2 text-sm focus:border-becker-purple outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Preço (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={versionPrice}
                  onChange={(e) => setVersionPrice(e.target.value)}
                  className="w-full border-2 border-becker-line rounded-xl px-3 py-2 text-sm focus:border-becker-purple outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Estoque</label>
                <input
                  type="number"
                  value={versionStock}
                  onChange={(e) => setVersionStock(e.target.value)}
                  className="w-full border-2 border-becker-line rounded-xl px-3 py-2 text-sm focus:border-becker-purple outline-none"
                />
              </div>
              <div className="col-span-2 md:col-span-4">
                <label className="block text-xs font-semibold mb-1">Peso (gramas — usado pro frete)</label>
                <input
                  type="number"
                  value={versionWeight}
                  onChange={(e) => setVersionWeight(e.target.value)}
                  placeholder="500"
                  className="w-full border-2 border-becker-line rounded-xl px-3 py-2 text-sm focus:border-becker-purple outline-none"
                />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 border-t border-becker-line pt-4 mt-2">
            <h3 className="font-bold mb-3">Flags</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <FlagToggle label="Ativo" value={active} onChange={setActive} />
              <FlagToggle label="TOP" value={isTop} onChange={setIsTop} />
              <FlagToggle label="Destaque" value={isFeatured} onChange={setIsFeatured} />
              <FlagToggle label="Novo" value={isNewFlag} onChange={setIsNewFlag} />
              <FlagToggle label="Eco" value={isEco} onChange={setIsEco} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border-2 border-becker-line text-becker-ink font-semibold py-3 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 bg-becker-purple text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {busy ? 'Salvando...' : isNew ? 'Criar produto' : 'Salvar alterações'}
          </button>
        </div>
      </form>
    </div>
  );
}

function FlagToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`px-3 py-2 rounded-full text-sm font-semibold border-2 ${
        value ? 'border-becker-purple bg-becker-purple text-white' : 'border-becker-line hover:border-becker-purple/30'
      }`}
    >
      {value ? '✓' : '○'} {label}
    </button>
  );
}
