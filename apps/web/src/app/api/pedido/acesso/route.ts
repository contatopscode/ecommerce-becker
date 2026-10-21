// ============================================================
// Troca o ?t= do link do pedido por um cookie assinado de 2 h, só para aquele pedido, e redireciona
// para a URL limpa /pedido/<id>. Assim o token não fica no histórico, no Referer nem nas ferramentas de análise.
// GET /api/pedido/acesso?ref=<id ou número>&t=<token>[&next=pagamento[&erro=cartao]]
// next=pagamento: destino FIXO /checkout/pagamento?orderId=<id do banco> (sem t); nenhum outro destino é aceito.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { orderIdFromToken, pedidoCookieValue } from '@/lib/auth/pedido-link';
import {
  PEDIDO_COOKIE,
  PEDIDO_COOKIE_MAX_AGE_SEC,
  PEDIDO_PAGAMENTO_COOKIE_PATH,
  pedidoCookiePath,
  pedidoPagamentoCookieName,
} from '@/lib/auth/pedido-cookie';

function redirectTo(path: string): NextResponse {
  // Location relativo: atrás do proxy o host de req.url é interno
  return new NextResponse(null, { status: 302, headers: { Location: path, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}

export async function GET(req: NextRequest) {
  const ref = (req.nextUrl.searchParams.get('ref') ?? '').slice(0, 64);
  const t = req.nextUrl.searchParams.get('t');
  if (!/^[A-Za-z0-9_-]+$/.test(ref)) return redirectTo('/rastrear');

  const tokenOrderId = orderIdFromToken(t);
  const order = tokenOrderId
    ? await prisma.order.findFirst({ where: { OR: [{ id: ref }, { number: ref }] }, select: { id: true } })
    : null;
  // Token inválido, de outro pedido ou pedido inexistente: cai na página (404 uniforme) sem cookie
  if (!order || order.id !== tokenOrderId) return redirectTo(`/pedido/${ref}`);

  if (req.nextUrl.searchParams.get('next') === 'pagamento') {
    const erro = req.nextUrl.searchParams.get('erro') === 'cartao' ? '&erro=cartao' : '';
    const pg = redirectTo(`/checkout/pagamento?orderId=${encodeURIComponent(order.id)}${erro}`);
    pg.cookies.set(pedidoPagamentoCookieName(order.id), pedidoCookieValue(order.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: PEDIDO_PAGAMENTO_COOKIE_PATH,
      maxAge: PEDIDO_COOKIE_MAX_AGE_SEC,
    });
    return pg;
  }

  const res = redirectTo(`/pedido/${order.id}`);
  res.cookies.set(PEDIDO_COOKIE, pedidoCookieValue(order.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: pedidoCookiePath(order.id),
    maxAge: PEDIDO_COOKIE_MAX_AGE_SEC,
  });
  return res;
}
