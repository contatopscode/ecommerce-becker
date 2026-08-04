// ============================================================
// Tipos compartilhados entre web e admin
// ============================================================

export interface ProductListItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  brand: string;
  isEco: boolean;
  isFeatured: boolean;
  isTop: boolean;
  isNew: boolean;
  rating: number;
  reviewCount: number;
  category: {
    id: string;
    slug: string;
    name: string;
  };
  primaryImage: string | null;
  priceFrom: number;
  priceTo: number;
  totalStock: number;
}

export interface ProductDetail extends ProductListItem {
  description: string;
  highlights: string[];
  images: Array<{ id: string; url: string; alt: string | null; isPrimary: boolean }>;
  versions: Array<{
    id: string;
    label: string;
    price: number;
    originalPrice: number | null;
    stock: number;
    sku: string;
  }>;
}

export interface CartItem {
  productId: string;
  versionId: string;
  qty: number;
  // cache local
  name?: string;
  image?: string;
  price?: number;
  label?: string;
}

export interface ShippingOption {
  id: 'pac' | 'sedex' | 'free';
  name: string;
  description: string;
  price: number;
  days: string;
  carrier?: string;
}
