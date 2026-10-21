// Selftest sem dependências: node --experimental-strip-types signed-cookie.selftest.ts
import assert from 'node:assert/strict';
import { signValue, verifyValue, secretWeakness } from './signed-cookie.ts';

process.env.SESSION_SECRET = 'teste-local-com-pelo-menos-32-caracteres-xx';

const ok = signValue('session', { userId: 'u1', role: 'CUSTOMER' }, 60);
const [body, sig] = ok.split('.');
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const cases: Array<[string, () => void]> = [
  ['token de OTP não vale como sessão', () =>
    assert.equal(verifyValue('session', signValue('otp', { userId: 'u1' }, 60)), null)],
  ['token de sessão não vale como OTP', () =>
    assert.equal(verifyValue('otp', signValue('session', { userId: 'u1' }, 60)), null)],
  ['typ forjado no payload com assinatura de outro tipo', () => {
    const forged = b64({ userId: 'u1', typ: 'session', exp: 9999999999 });
    assert.equal(verifyValue('session', `${forged}.${signValue('otp', {}, 60).split('.')[1]}`), null);
  }],
  ['segredo fraco/exemplo rejeitado', () => {
    assert.notEqual(secretWeakness('curto'), null);
    assert.notEqual(secretWeakness('trocar-por-uma-chave-segura-aqui'), null);
    assert.notEqual(secretWeakness('x'.repeat(40) + 'trocar-por'), null);
    assert.equal(secretWeakness('a'.repeat(32)), null);
  }],
  ['assinatura válida', () => assert.equal(verifyValue('session', ok)?.userId, 'u1')],
  ['payload adulterado (role ADMIN)', () =>
    assert.equal(verifyValue('session', `${b64({ userId: 'u1', role: 'ADMIN', exp: 9999999999 })}.${sig}`), null)],
  ['assinatura trocada', () => {
    const other = signValue('session', { userId: 'u2', role: 'CUSTOMER' }, 60).split('.')[1];
    assert.equal(verifyValue('session', `${body}.${other}`), null);
  }],
  ['expirado', () => assert.equal(verifyValue('session', signValue('session', { userId: 'u1' }, -1)), null)],
  ['JSON cru antigo', () => assert.equal(verifyValue('session', '{"role":"ADMIN"}'), null)],
  ['formato inválido', () => {
    assert.equal(verifyValue('session', 'abc'), null);
    assert.equal(verifyValue('session', 'a.b.c'), null);
    assert.equal(verifyValue('session', 'a.!!'), null);
  }],
  ['token vazio', () => {
    assert.equal(verifyValue('session', ''), null);
    assert.equal(verifyValue('session', undefined), null);
  }],
];
for (const [name, fn] of cases) {
  fn();
  console.log(`ok - ${name}`);
}
console.log(`${cases.length}/${cases.length} passaram`);
