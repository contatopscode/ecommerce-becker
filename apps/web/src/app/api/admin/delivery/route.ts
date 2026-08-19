// ============================================================
// API: Admin cria/busca delivery por orderId (protegido)
// POST /api/admin/delivery
//   body: { orderId, motoboyName?, motoboyPhone? }
//   → cria delivery (idempotente) + envia WhatsApp "saiu pra entrega"
// GET /api/admin/delivery?orderId=...
//   → busca delivery pelo orderId
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { createOutForDelivery } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { orderId, motoboyName, motoboyPhone } = await req.json();
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId obrigatório' }, { status: 400 });
    }

    const result = await createOutForDelivery({
      orderId,
      motoboyName,
      motoboyPhone,
      actor: 'admin',
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, deliveryId: result.deliveryId });
  } catch (e: any) {
    console.error('[admin/delivery] POST error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const orderId = req.nextUrl.searchParams.get('orderId');
    if (!orderId) {
      return NextResponse.json({ ok: false, error: 'orderId obrigatório' }, { status: 400 });
    }

    const delivery = await prisma.delivery.findUnique({
      where: { orderId },
      include: {
        events: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!delivery) {
      return NextResponse.json({ ok: false, error: 'Delivery não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, delivery });
  } catch (e: any) {
    console.error('[admin/delivery] GET error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
