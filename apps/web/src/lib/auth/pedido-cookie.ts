// Cookie de acesso a UM pedido, de curta duração. Troca o ?t= da URL depois que o link foi validado,
// para o token não ficar no histórico, no Referer nem em ferramentas de análise.
// Reaproveita pedido-token.ts com um segredo derivado ('|cookie'): o valor do cookie não vale como ?t=
// e o ?t= não vale como cookie. Funções puras: o segredo entra por parâmetro.

import { signPedidoToken, verifyPedidoToken } from './pedido-token.ts';

export const PEDIDO_COOKIE = 'pedido_acesso';
export const PEDIDO_COOKIE_MAX_AGE_SEC = 2 * 60 * 60;

const cookieSecret = (secret: string): string => `${secret}|cookie`;

/** O cookie só é enviado para as rotas daquele pedido. */
export function pedidoCookiePath(orderId: string): string {
  return `/pedido/${orderId}`;
}

export function signPedidoCookie(secret: string, orderId: string, maxAgeSec: number = PEDIDO_COOKIE_MAX_AGE_SEC): string {
  return signPedidoToken(cookieSecret(secret), orderId, maxAgeSec);
}

/** orderId do cookie válido, ou null. */
export function verifyPedidoCookie(secret: string, value: string | undefined | null): string | null {
  return verifyPedidoToken(cookieSecret(secret), value);
}

// Cookie de pagamento: path '/' (vale para /checkout/pagamento e /api/orders/*), mas o NOME inclui o id,
// então o navegador só o envia como "deste pedido" e o servidor confere nome e valor.
export const PEDIDO_PAGAMENTO_COOKIE_PATH = '/';

export function pedidoPagamentoCookieName(orderId: string): string {
  return `pedido_pg_${orderId}`;
}

/** true se o valor é um cookie válido do pedido `orderId` (o id assinado precisa ser exatamente o do nome). */
export function pagamentoCookieAutoriza(secret: string, orderId: string, value: string | undefined | null): boolean {
  return verifyPedidoCookie(secret, value) === orderId;
}
