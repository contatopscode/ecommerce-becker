// Selftest sem dependências: node --experimental-strip-types pedido-access.selftest.ts
import assert from 'node:assert/strict';
import { canonicalPhone, phonesMatch, canViewOrder } from './pedido-access.ts';
import { signPedidoToken as sp, verifyPedidoToken as vp } from './pedido-token.ts';

const SECRET = 'teste-local-com-pelo-menos-32-caracteres-xx';
const signPedidoToken = (id: string, age?: number) => sp(SECRET, id, age);
const verifyPedidoToken = (t: string) => vp(SECRET, t);

const guest = { id: 'o1', userId: null, guestWhatsapp: '558199441333', userWhatsapp: null };
const owned = { id: 'o2', userId: 'u1', guestWhatsapp: null, userWhatsapp: '5581999441333' };
const cust = { userId: 'u1', role: 'CUSTOMER', whatsapp: '5581999441333' };
const other = { userId: 'u9', role: 'CUSTOMER', whatsapp: '5511988887777' };
const cases: Array<[string, () => void]> = [
  ['canônico: com/sem 55 e 9 extra', () => {
    assert.equal(canonicalPhone('(81) 99944-1333'), '8199441333');
    assert.equal(canonicalPhone('5581999441333'), '8199441333');
    assert.equal(canonicalPhone('558199441333'), '8199441333');
  }],
  ['telefones iguais/diferentes', () => {
    assert.ok(phonesMatch('81999441333', '+55 81 99944-1333'));
    assert.ok(!phonesMatch('81999441333', '81999441334'));
    assert.ok(!phonesMatch('', ''));
    assert.ok(!phonesMatch(null, undefined));
  }],
  ['sem sessão e sem token: negado', () => assert.equal(canViewOrder(owned, null, null), false)],
  ['dono por userId', () => assert.equal(canViewOrder(owned, cust, null), true)],
  ['outro usuário negado', () => assert.equal(canViewOrder(owned, other, null), false)],
  ['admin permitido', () => assert.equal(canViewOrder(owned, { ...other, role: 'ADMIN' }, null), true)],
  ['convidado: dono pelo WhatsApp', () => assert.equal(canViewOrder(guest, cust, null), true)],
  ['token do pedido certo', () => assert.equal(canViewOrder(owned, null, 'o2'), true)],
  ['token de outro pedido negado', () => assert.equal(canViewOrder(owned, null, 'o1'), false)],
  ['token assinado round-trip', () => assert.equal(verifyPedidoToken(signPedidoToken('o2')), 'o2')],
  ['token expirado', () => assert.equal(verifyPedidoToken(signPedidoToken('o2', -1)), null)],
  ['token adulterado', () => {
    const [b, s] = signPedidoToken('o2').split('.');
    const forged = Buffer.from(JSON.stringify({ orderId: 'o1', typ: 'pedido', exp: 9999999999 })).toString('base64url');
    assert.equal(verifyPedidoToken(`${forged}.${s}`), null);
    assert.equal(verifyPedidoToken(`${b}.x`), null);
    assert.equal(verifyPedidoToken('lixo'), null);
  }],
  ['segredo diferente invalida', () => assert.equal(vp('outro-segredo-com-mais-de-32-caracteres-x', signPedidoToken('o2')), null)],
  ['token de sessão não vale como pedido', () => {
    const body = Buffer.from(JSON.stringify({ orderId: 'o2', typ: 'session', exp: 9999999999 })).toString('base64url');
    assert.equal(verifyPedidoToken(`${body}.AAAA`), null);
  }],
];
let failed = 0;
for (const [name, fn] of cases) {
  try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${(e as Error).message}`); }
}
if (failed) process.exit(1);
console.log(`${cases.length} casos ok`);
