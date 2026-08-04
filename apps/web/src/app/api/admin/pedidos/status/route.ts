// ============================================================
// API Admin: Mudar status do pedido
// POST /api/admin/pedidos/status
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { getSession } from '@/lib/auth/session';
import { sendWhatsApp } from '@/lib/whatsapp-client';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ ok: false, error: 'Não autorizado' }, { status: 403 });
    }

    const { orderId, status, tracking } = await req.json();
    if (!orderId || !status) {
      return NextResponse.json({ ok: false, error: 'orderId e status obrigatórios' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) return NextResponse.json({ ok: false, error: 'Pedido não encontrado' }, { status: 404 });

    // Atualizar
    const updateData: any = { status };
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
      if (tracking) updateData.tracking = tracking;
    }
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();
    if (status === 'PAID') {
      updateData.paymentStatus = 'PAID';
      updateData.paidAt = new Date();
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    // Notifica cliente via WhatsApp (best-effort)
    const phone = order.user?.whatsapp || order.guestWhatsapp;
    if (phone) {
      const messages: Record<string, string> = {
        PAID: `💰 *Becker* - Pagamento confirmado!\n\nPedido *${order.number}* está sendo preparado.`,
        PROCESSING: `📦 *Becker* - Em separação!\n\nEstamos separando seu pedido *${order.number}* com carinho.`,
        SHIPPED: `🚚 *Becker* - Pedido enviado!\n\nPedido *${order.number}* a caminho!\nRastreio: ${updated.tracking || 'em breve'}`,
        DELIVERED: `✅ *Becker* - Pedido entregue!\n\nEsperamos que tenha gostado! Obrigado por comprar na Becker 💜`,
        CANCELED: `❌ *Becker* - Pedido cancelado\n\nPedido *${order.number}* foi cancelado. Em caso de dúvidas, é só chamar.`,
      };
      const msg = messages[status];
      if (msg) {
        try {
          await sendWhatsApp({ number: phone, text: msg });
        } catch (e) {
          console.error('Erro ao notificar cliente:', e);
        }
      }
    }

    return NextResponse.json({ ok: true, order: updated });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
