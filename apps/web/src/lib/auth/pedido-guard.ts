// Autorização de acesso a um pedido por id (rotas de pagamento/status). Mesma regra de /pedido/[id]:
// dono pela sessão, admin ou portador de ?t= válido para ESTE pedido. Nunca emite token.

import 'server-only';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { canViewOrder } from '@/lib/auth/pedido-access';
import { orderIdFromToken } from '@/lib/auth/pedido-link';

export async function canAccessOrderId(orderId: string, token: string | null | undefined): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, guestWhatsapp: true, user: { select: { whatsapp: true } } },
  });
  if (!order) return false;
  const session = await getSession();
  return canViewOrder(
    { id: order.id, userId: order.userId, guestWhatsapp: order.guestWhatsapp, userWhatsapp: order.user?.whatsapp ?? null },
    session ? { userId: session.userId, role: session.role, whatsapp: session.whatsapp } : null,
    orderIdFromToken(token),
  );
}
