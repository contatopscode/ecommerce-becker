// ============================================================
// API: Pedidos do usuário logado
// GET /api/conta/pedidos  (exige sessão; usa o WhatsApp da sessão)
// ============================================================

import { NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { phoneVariants } from '@/lib/auth/pedido-access';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  try {
    const variants = phoneVariants(session.whatsapp);
    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { userId: session.userId },
          ...(variants.length > 0 ? [{ userId: null, guestWhatsapp: { in: variants } }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: { items: true },
    });

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: o.id,
        number: o.number,
        date: o.createdAt.toISOString().slice(0, 10),
        status: o.status,
        total: Number(o.total),
        itemCount: o.items.length,
        tracking: o.tracking,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar pedidos' }, { status: 500 });
  }
}
