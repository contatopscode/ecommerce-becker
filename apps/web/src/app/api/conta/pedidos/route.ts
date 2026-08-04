// ============================================================
// API: Pedidos do usuário (por WhatsApp)
// GET /api/conta/pedidos?whatsapp=...
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const whatsapp = searchParams.get('whatsapp');
    if (!whatsapp) return NextResponse.json({ orders: [] });

    const cleaned = whatsapp.replace(/\D/g, '');
    const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    const orders = await prisma.order.findMany({
      where: {
        OR: [
          { user: { whatsapp: fullPhone } },
          { guestWhatsapp: fullPhone },
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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
