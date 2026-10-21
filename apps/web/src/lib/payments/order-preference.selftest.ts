// Selftest sem dependências: node --experimental-strip-types order-preference.selftest.ts
import assert from 'node:assert/strict';
import { buildPreferenceItems, isMercadoPagoUrl } from './preference-items.ts';

const base = [
  { id: 'a', productName: 'Kit A', versionLabel: '110V', qty: 2, price: 100 },
  { id: 'b', productName: 'Peça B', qty: 1, price: 50.5 },
];
const mk = (o: { total: number; shipping: number; discount: number; items?: typeof base }) =>
  ({ number: 'B-1001', items: base, ...o });

const cases: Array<[string, () => void]> = [
  ['sem desconto: itens reais + frete', () => {
    const r = buildPreferenceItems(mk({ total: 270.5, shipping: 20, discount: 0 }));
    assert.equal(r.ok, true);
    assert.equal(r.items.length, 2);
    assert.equal(r.items[0].title, 'Kit A - 110V');
    assert.equal(r.shippingCost, 20);
    assert.equal(r.totalCheck, 270.5);
  }],
  ['cupom percentual (10% de 250,50 = 25,05)', () => {
    const r = buildPreferenceItems(mk({ total: 245.45, shipping: 20, discount: 25.05 }));
    assert.equal(r.ok, true);
    assert.equal(r.items.length, 1);
    assert.equal(r.items[0].title, 'Pedido B-1001');
    assert.equal(r.items[0].unit_price, 225.45);
    assert.equal(r.shippingCost, 20);
    assert.equal(r.totalCheck, 245.45);
  }],
  ['cupom fixed (R$ 30)', () => {
    const r = buildPreferenceItems(mk({ total: 240.5, shipping: 20, discount: 30 }));
    assert.equal(r.ok, true);
    assert.equal(r.items[0].unit_price, 220.5);
    assert.equal(r.totalCheck, 240.5);
  }],
  ['cupom de frete (desconto 0, frete zerado)', () => {
    const r = buildPreferenceItems(mk({ total: 250.5, shipping: 0, discount: 0 }));
    assert.equal(r.ok, true);
    assert.equal(r.items.length, 2);
    assert.equal(r.shippingCost, 0);
    assert.equal(r.totalCheck, 250.5);
  }],
  ['desconto maior que o subtotal (total só frete)', () => {
    const r = buildPreferenceItems(mk({ total: 20, shipping: 20, discount: 300 }));
    assert.equal(r.ok, true);
    assert.equal(r.items.length, 1);
    assert.equal(r.items[0].unit_price, 20);
    assert.equal(r.shippingCost, 0);
    assert.equal(r.totalCheck, 20);
  }],
  ['nenhum item com preço negativo em qualquer caso', () => {
    for (const d of [0, 10, 300]) {
      const r = buildPreferenceItems(mk({ total: 100, shipping: 20, discount: d }));
      assert.ok(r.items.every((i) => i.unit_price > 0));
    }
  }],
  ['centavos: 3 x 33,33 + frete 0,01', () => {
    const r = buildPreferenceItems({
      number: 'B-2', total: 100, shipping: 0.01, discount: 0,
      items: [{ id: 'x', productName: 'X', qty: 3, price: 33.33 }],
    });
    assert.equal(r.ok, true);
    assert.equal(r.totalCheck, 100);
  }],
  ['total divergente é recusado', () => {
    const r = buildPreferenceItems(mk({ total: 999, shipping: 20, discount: 0 }));
    assert.equal(r.ok, false);
    assert.ok(r.error);
  }],
  ['initPoint: só https em mercadopago.com(.br)', () => {
    assert.equal(isMercadoPagoUrl('https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=1'), true);
    assert.equal(isMercadoPagoUrl('https://mercadopago.com/x'), true);
    assert.equal(isMercadoPagoUrl('http://www.mercadopago.com.br/x'), false);
    assert.equal(isMercadoPagoUrl('https://mercadopago.com.evil.com/x'), false);
    assert.equal(isMercadoPagoUrl('https://evilmercadopago.com/x'), false);
    assert.equal(isMercadoPagoUrl('javascript:alert(1)'), false);
    assert.equal(isMercadoPagoUrl(undefined), false);
  }],
];

let failed = 0;
for (const [name, fn] of cases) {
  try { fn(); console.log(`ok   - ${name}`); } catch (e) { failed++; console.log(`FAIL - ${name}: ${e instanceof Error ? e.message : e}`); }
}
console.log(failed ? `${failed} falha(s)` : `${cases.length} casos ok`);
process.exit(failed ? 1 : 0);
