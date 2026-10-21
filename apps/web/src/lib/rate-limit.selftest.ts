// Selftest sem dependências: node --experimental-strip-types src/lib/rate-limit.selftest.ts
import { clientIpFromHeaders, rateLimit, rateLimitKey } from './rate-limit-core.ts';

let falhas = 0;
function check(nome: string, cond: boolean): void {
  console.log(`${cond ? 'PASS' : 'FAIL'} ${nome}`);
  if (!cond) falhas++;
}
const hdr = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });

const ip = '1.2.3.4';
const search = { max: 60, windowMs: 60_000 };
const cotacao = { max: 5, windowMs: 3_600_000 };

check('rateLimitKey monta nome:ip', rateLimitKey('search', ip) === 'search:1.2.3.4');

for (let i = 0; i < 8; i++) rateLimit(rateLimitKey('search', ip), search);
const c1 = rateLimit(rateLimitKey('cotacao', ip), cotacao);
check('8 buscas não consomem a cotação', c1.ok && c1.remaining === 4);

let ultimo = c1;
for (let i = 0; i < 5; i++) ultimo = rateLimit(rateLimitKey('cotacao', ip), cotacao);
check('cotação estoura no 6º pedido (max 5)', !ultimo.ok);
check('busca segue liberada com cotação estourada', rateLimit(rateLimitKey('search', ip), search).ok);
check('outro IP não é afetado', rateLimit(rateLimitKey('cotacao', '9.9.9.9'), cotacao).ok);
check('janelas independentes por chave', Math.abs(rateLimit(rateLimitKey('search', ip), search).resetAt - rateLimit(rateLimitKey('cotacao', ip), cotacao).resetAt) > 1000);

const curta = { max: 1, windowMs: 20 };
const k = rateLimitKey('curta', ip);
rateLimit(k, curta);
check('2ª chamada acima do max falha', !rateLimit(k, curta).ok);
await new Promise((r) => setTimeout(r, 40));
check('janela expirada reinicia', rateLimit(k, curta).ok);

check('xff usa o último valor', clientIpFromHeaders(hdr({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7' })) === '7.7.7.7');
check('x-real-ip sem xff', clientIpFromHeaders(hdr({ 'x-real-ip': ' 5.5.5.5 ' })) === '5.5.5.5');
check('unknown sem cabeçalhos', clientIpFromHeaders(hdr({})) === 'unknown');

if (falhas > 0) {
  console.log(`${falhas} falha(s)`);
  process.exit(1);
}
console.log('OK');
