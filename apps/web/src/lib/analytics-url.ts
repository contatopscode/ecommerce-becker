// URL enviada a GA4/Facebook Pixel: sem token, sem id de pedido (função pura, sem dependências).

const SENSITIVE_QUERY = ['t', 'orderId'];

/** Rotas cujo caminho ou query identifica um pedido: o Pixel não é carregado nelas. */
export function isOrderPath(pathname: string): boolean {
  return pathname === '/checkout/pagamento' || pathname === '/pedido' || pathname.startsWith('/pedido/');
}

/** Remove 't' e 'orderId' da query e troca o id em /pedido/<id> por /pedido/[id]. */
export function sanitizeUrlForAnalytics(href: string): string {
  const u = new URL(href);
  for (const k of SENSITIVE_QUERY) u.searchParams.delete(k);
  const pathname = u.pathname.replace(/^\/pedido\/[^/]+/, '/pedido/[id]');
  const qs = u.searchParams.toString();
  return `${u.origin}${pathname}${qs ? `?${qs}` : ''}`;
}
