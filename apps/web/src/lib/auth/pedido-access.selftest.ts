// Selftest sem dependências: node --experimental-strip-types pedido-access.selftest.ts
import assert from 'node:assert/strict';
import { canonicalPhone, phonesMatch, canViewOrder } from './pedido-access.ts';
import {
  signPedidoCookie,
  verifyPedidoCookie,
  pedidoCookiePath,
  pedidoPagamentoCookieName,
  pagamentoCookieAutoriza,
  PEDIDO_PAGAMENTO_COOKIE_PATH,
} from './pedido-cookie.ts';
import { isValidCnpj } from '../cnpj.ts';
import { sanitizeUrlForAnalytics, isOrderPath } from '../analytics-url.ts';
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
// Decisão do pedido: token verificado OU cookie verificado entram em canViewOrder como o id autorizado
const cookieId = (v: string | null) => verifyPedidoCookie(SECRET, v);
cases.push(
  ['sem t e sem sessão: negado', () => assert.equal(canViewOrder(owned, null, verifyPedidoToken('')), false)],
  ['t de outro pedido: negado', () => assert.equal(canViewOrder(owned, null, verifyPedidoToken(signPedidoToken('o1'))), false)],
  ['t do pedido certo: permitido', () => assert.equal(canViewOrder(owned, null, verifyPedidoToken(signPedidoToken('o2'))), true)],
  ['cookie do pedido certo: permitido', () => assert.equal(canViewOrder(owned, null, cookieId(signPedidoCookie(SECRET, 'o2'))), true)],
  ['cookie de outro pedido: negado', () => assert.equal(canViewOrder(owned, null, cookieId(signPedidoCookie(SECRET, 'o1'))), false)],
  ['cookie expirado: negado', () => assert.equal(cookieId(signPedidoCookie(SECRET, 'o2', -1)), null)],
  ['cookie não vale como ?t= e ?t= não vale como cookie', () => {
    assert.equal(verifyPedidoToken(signPedidoCookie(SECRET, 'o2')), null);
    assert.equal(cookieId(signPedidoToken('o2')), null);
  }],
  ['cookie com segredo diferente: negado', () => assert.equal(verifyPedidoCookie('outro-segredo-com-mais-de-32-caracteres-x', signPedidoCookie(SECRET, 'o2')), null)],
  ['cookie só vale no caminho do pedido', () => assert.equal(pedidoCookiePath('o2'), '/pedido/o2')],
  ['cookie de pagamento: nome inclui o id e path é "/"', () => {
    assert.equal(pedidoPagamentoCookieName('o2'), 'pedido_pg_o2');
    assert.notEqual(pedidoPagamentoCookieName('o1'), pedidoPagamentoCookieName('o2'));
    assert.equal(PEDIDO_PAGAMENTO_COOKIE_PATH, '/');
  }],
  ['cookie de pagamento do pedido A não autoriza o pedido B', () => {
    const a = signPedidoCookie(SECRET, 'o1');
    assert.equal(pagamentoCookieAutoriza(SECRET, 'o1', a), true);
    assert.equal(pagamentoCookieAutoriza(SECRET, 'o2', a), false);
    assert.equal(canViewOrder(owned, null, pagamentoCookieAutoriza(SECRET, 'o2', a) ? 'o2' : null), false);
  }],
  ['cookie de pagamento: ausente, expirado, ?t= e lixo negados', () => {
    assert.equal(pagamentoCookieAutoriza(SECRET, 'o2', undefined), false);
    assert.equal(pagamentoCookieAutoriza(SECRET, 'o2', signPedidoCookie(SECRET, 'o2', -1)), false);
    assert.equal(pagamentoCookieAutoriza(SECRET, 'o2', signPedidoToken('o2')), false);
    assert.equal(pagamentoCookieAutoriza(SECRET, 'o2', 'lixo'), false);
  }],
  ['CNPJ válido (com e sem máscara)', () => {
    assert.ok(isValidCnpj('11.222.333/0001-81'));
    assert.ok(isValidCnpj('11222333000181'));
    assert.ok(isValidCnpj('00.000.000/0001-91'));
  }],
  ['CNPJ inválido', () => {
    assert.ok(!isValidCnpj('11.222.333/0001-82'));
    assert.ok(!isValidCnpj('11111111111111'));
    assert.ok(!isValidCnpj('123'));
    assert.ok(!isValidCnpj(''));
  }],
  ['analytics: sem t, sem orderId e sem id do pedido', () => {
    assert.equal(sanitizeUrlForAnalytics('https://x.com/checkout/pagamento?orderId=abc&t=tok.sig&utm_source=g'), 'https://x.com/checkout/pagamento?utm_source=g');
    assert.equal(sanitizeUrlForAnalytics('https://x.com/pedido/abc123?t=tok.sig&status=approved'), 'https://x.com/pedido/[id]?status=approved');
    assert.equal(sanitizeUrlForAnalytics('https://x.com/produtos?x=1'), 'https://x.com/produtos?x=1');
    assert.ok(isOrderPath('/pedido/abc') && isOrderPath('/checkout/pagamento') && !isOrderPath('/produtos'));
  }],
);
let failed = 0;
for (const [name, fn] of cases) {
  try { fn(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${(e as Error).message}`); }
}
if (failed) process.exit(1);
console.log(`${cases.length} casos ok`);
