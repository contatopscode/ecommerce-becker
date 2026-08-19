// ============================================================
// API: Admin delivery management (protegido)
// GET /api/admin/delivery/[id]
//   → retorna delivery + events
// PATCH /api/admin/delivery/[id]
//   body: { motoboyName?, motoboyPhone?, status? }
//   → admin atualiza dados
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { createOutForDelivery } from '@/lib/delivery';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: true,
            address: true,
            items: true,
          },
        },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { motoboyName, motoboyPhone, status, action } = body;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) {
      return NextResponse.json({ ok: false, error: 'Delivery não encontrada' }, { status: 404 });
    }

    // Se action é "dispatch", cria o out_for_delivery (idempotente)
    if (action === 'dispatch') {
      const result = await createOutForDelivery({
        orderId: delivery.orderId,
        motoboyName: motoboyName,
        motoboyPhone: motoboyPhone,
        actor: 'admin',
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
      }
      return NextResponse.json({ ok: true, deliveryId: result.deliveryId });
    }

    // Update normal
    const updated = await prisma.delivery.update({
      where: { id },
      data: {
        motoboyName: motoboyName ?? undefined,
        motoboyPhone: motoboyPhone ?? undefined,
        status: status ?? undefined,
        events: {
          create: {
            type: 'manual_update',
            actor: 'admin',
            message: `Admin atualizou: ${JSON.stringify({ motoboyName, motoboyPhone, status })}`,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, delivery: updated });
  } catch (e: any) {
    console.error('[admin/delivery] PATCH error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro interno' },
      { status: 500 }
    );
  }
}
