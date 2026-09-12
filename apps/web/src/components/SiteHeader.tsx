// ============================================================
// SiteHeader - Server Component: categorias do banco → Header
// ============================================================

import { fetchCategories } from '@/lib/products';
import { Header, type HeaderCategory } from './Header';

export async function SiteHeader() {
  const rows = await fetchCategories();
  const categories: HeaderCategory[] = rows.slice(0, 6).map((c) => ({
    slug: c.slug,
    name: c.name,
    icon: c.icon,
  }));

  return <Header categories={categories} />;
}
