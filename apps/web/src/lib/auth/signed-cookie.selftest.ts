// Selftest sem dependências: node --experimental-strip-types signed-cookie.selftest.ts
import assert from 'node:assert/strict';
import { signValue, verifyValue } from './signed-cookie.ts';

process.env.SESSION_SECRET = 'segredo-de-teste';

const ok = signValue({ userId: 'u1', role: 'CUSTOMER' }, 60);
const [body, sig] = ok.split('.');
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const cases: Array<[string, () => void]> = [
  ['assinatura válida', () => assert.equal(verifyValue(ok)?.userId, 'u1')],
  ['payload adulterado (role ADMIN)', () =>
    assert.equal(verifyValue(`${b64({ userId: 'u1', role: 'ADMIN', exp: 9999999999 })}.${sig}`), null)],
  ['assinatura trocada', () => {
    const other = signValue({ userId: 'u2', role: 'CUSTOMER' }, 60).split('.')[1];
    assert.equal(verifyValue(`${body}.${other}`), null);
  }],
  ['expirado', () => assert.equal(verifyValue(signValue({ userId: 'u1' }, -1)), null)],
  ['JSON cru antigo', () => assert.equal(verifyValue('{"role":"ADMIN"}'), null)],
  ['formato inválido', () => {
    assert.equal(verifyValue('abc'), null);
    assert.equal(verifyValue('a.b.c'), null);
    assert.equal(verifyValue('a.!!'), null);
  }],
  ['token vazio', () => {
    assert.equal(verifyValue(''), null);
    assert.equal(verifyValue(undefined), null);
  }],
];
for (const [name, fn] of cases) {
  fn();
  console.log(`ok - ${name}`);
}
console.log(`${cases.length}/${cases.length} passaram`);
