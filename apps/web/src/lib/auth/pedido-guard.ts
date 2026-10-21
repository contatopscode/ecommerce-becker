// Autorização de acesso a um pedido por id (rotas de pagamento/status). Mesma regra de /pedido/[id]:
// dono pela sessão, admin ou portador de ?t= ou do cookie de pagamento válido para ESTE pedido. Nunca emite token.

import 'server-only';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { canViewOrder } from '@/lib/auth/pedido-access';
import { cookies } from 'next/headers';
import { orderIdFromToken, pagamentoCookieValido } from '@/lib/auth/pedido-link';
import { pedidoPagamentoCookieName } from '@/lib/auth/pedido-cookie';

export async function canAccessOrderId(orderId: string, token: string | null | undefined): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, guestWhatsapp: true, user: { select: { whatsapp: true } } },
  });
  if (!order) return false;
  // ?t= válido OU cookie de pagamento deste pedido (o nome do cookie inclui o id)
  const cookieValue = (await cookies()).get(pedidoPagamentoCookieName(orderId))?.value;
  const authorizedId = orderIdFromToken(token) ?? (pagamentoCookieValido(orderId, cookieValue) ? orderId : null);
  const session = await getSession();
  return canViewOrder(
    { id: order.id, userId: order.userId, guestWhatsapp: order.guestWhatsapp, userWhatsapp: order.user?.whatsapp ?? null },
    session ? { userId: session.userId, role: session.role, whatsapp: session.whatsapp } : null,
    authorizedId,
  );
}
