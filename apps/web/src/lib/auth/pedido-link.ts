// Token/link de acesso a pedido com o segredo de sessão do servidor.

import { getSecret } from '@/lib/auth/signed-cookie';
import { signPedidoToken, verifyPedidoToken } from '@/lib/auth/pedido-token';
import { signPedidoCookie, verifyPedidoCookie } from '@/lib/auth/pedido-cookie';

export function pedidoToken(orderId: string): string {
  return signPedidoToken(getSecret(), orderId);
}

export function orderIdFromToken(token: string | undefined | null): string | null {
  return verifyPedidoToken(getSecret(), token);
}

export function siteBase(): string {
  return (process.env.SITE_DOMAIN || process.env.NEXTAUTH_URL || 'https://becker.pscode.ia.br').replace(/\/$/, '');
}

/** Link do pedido com token. `ref` é o id ou o número exibido na URL. */
export function pedidoLink(orderId: string, ref: string, query = ''): string {
  return `${siteBase()}/pedido/${ref}?${query}t=${pedidoToken(orderId)}`;
}

export function pedidoCookieValue(orderId: string): string {
  return signPedidoCookie(getSecret(), orderId);
}

export function orderIdFromCookie(value: string | undefined | null): string | null {
  return verifyPedidoCookie(getSecret(), value);
}

/** Link da tela de pagamento com token (o id sozinho não dá acesso). */
export function pagamentoLink(orderId: string, query = ''): string {
  return `${siteBase()}/checkout/pagamento?orderId=${orderId}&${query}t=${encodeURIComponent(pedidoToken(orderId))}`;
}
