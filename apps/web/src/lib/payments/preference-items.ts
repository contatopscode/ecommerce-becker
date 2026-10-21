// ============================================================
// Montagem pura dos itens da preferência do Checkout Pro
// Sem dependências de servidor: pode ser testada e importada no front.
// O Mercado Pago não aceita item com preço negativo; descontos entram
// como um único item "Pedido <número>" com o total já descontado.
// ============================================================

export interface PreferenceOrderItem {
  id: string;
  productName: string;
  versionLabel?: string | null;
  qty: number;
  price: number;
}

export interface PreferenceOrder {
  number: string;
  total: number;
  shipping: number;
  discount: number;
  items: PreferenceOrderItem[];
}

export interface PreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
}

export interface PreferenceItemsResult {
  ok: boolean;
  items: PreferenceItem[];
  shippingCost: number;
  /** soma dos itens + frete enviados ao MP */
  totalCheck: number;
  error?: string;
}

const TOLERANCE = 0.01;

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function buildPreferenceItems(order: PreferenceOrder): PreferenceItemsResult {
  const total = round2(order.total);
  const shipping = round2(order.shipping);
  const discount = round2(order.discount);

  let items: PreferenceItem[];
  let shippingCost: number;

  if (discount > 0) {
    const net = round2(total - shipping);
    if (net > 0) {
      items = [{ id: order.number, title: `Pedido ${order.number}`, quantity: 1, unit_price: net, currency_id: 'BRL' }];
      shippingCost = shipping;
    } else {
      items = [{ id: order.number, title: `Pedido ${order.number}`, quantity: 1, unit_price: total, currency_id: 'BRL' }];
      shippingCost = 0;
    }
  } else {
    items = order.items.map((i) => ({
      id: i.id,
      title: i.versionLabel ? `${i.productName} - ${i.versionLabel}` : i.productName,
      quantity: i.qty,
      unit_price: round2(i.price),
      currency_id: 'BRL',
    }));
    shippingCost = shipping > 0 ? shipping : 0;
  }

  const totalCheck = round2(items.reduce((s, i) => s + i.quantity * i.unit_price, 0) + shippingCost);
  const invalid =
    items.length === 0 ||
    items.some((i) => !(i.unit_price > 0) || !Number.isInteger(i.quantity) || i.quantity < 1) ||
    !(total > 0) ||
    Math.abs(totalCheck - total) > TOLERANCE;

  if (invalid) {
    return { ok: false, items, shippingCost, totalCheck, error: 'Valores do pedido inconsistentes para o pagamento' };
  }
  return { ok: true, items, shippingCost, totalCheck };
}

/** Só https e host mercadopago.com ou *.mercadopago.com(.br). */
export function isMercadoPagoUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    return ['mercadopago.com', 'mercadopago.com.br'].some((d) => h === d || h.endsWith(`.${d}`));
  } catch {
    return false;
  }
}
