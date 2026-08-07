// ============================================================
// API: Buscar OU criar pré-cadastro por WhatsApp
// GET /api/customer/by-whatsapp?whatsapp=81999998888
// Sprint 3: pré-cadastra se não existir (lead capture)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { randomBytes } from 'crypto';
import { notifyNewLead } from '@/lib/notify';

function formatWhatsApp(phone: string) {
  const cleaned = phone.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length <= 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}

export async function GET(req: NextRequest) {
  const rawWhatsapp = req.nextUrl.searchParams.get('whatsapp') || '';

  if (rawWhatsapp.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ ok: false, error: 'WhatsApp inválido' }, { status: 400 });
  }

  const whatsappFormatted = formatWhatsApp(rawWhatsapp);
  const whatsappDigits = whatsappFormatted.replace(/\D/g, '');

  try {
    // Buscar formatos comuns
    const formats = [
      whatsappFormatted,
      `(${whatsappDigits.slice(0, 2)}) ${whatsappDigits.slice(2, 6)}-${whatsappDigits.slice(6)}`,
      `(${whatsappDigits.slice(0, 2)})9${whatsappDigits.slice(2, 7)}-${whatsappDigits.slice(7)}`,
      whatsappDigits,
      // Com código do país
      `55${whatsappDigits}`,
    ];

    let user = await prisma.user.findFirst({
      where: { whatsapp: { in: formats } },
      include: {
        addresses: { where: { isDefault: true }, take: 1 },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { address: true },
        },
      },
    });

    let isNewLead = false;

    if (!user) {
      // PRÉ-CADASTRO automático (lead capture)
      // Cria o cliente com nome padrão baseado no número
      isNewLead = true;
      const id = randomBytes(12).toString('hex');
      try {
        user = await prisma.user.create({
          data: {
            id,
            name: `Cliente ${whatsappDigits.slice(-4)}`, // "Cliente 1333"
            whatsapp: whatsappFormatted,
            role: 'CUSTOMER',
          },
          include: {
            addresses: true,
            orders: true,
          },
        });
      } catch (e: any) {
        // Se der erro de duplicata (race condition), busca de novo
        user = await prisma.user.findFirst({
          where: { whatsapp: { in: formats } },
          include: {
            addresses: { where: { isDefault: true }, take: 1 },
            orders: { orderBy: { createdAt: 'desc' }, take: 1, include: { address: true } },
          },
        });
        if (!user) throw e;
        isNewLead = false;
      }
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Erro ao criar/buscar cliente' }, { status: 500 });
    }

    // Notifica admin (WhatsApp) sobre lead novo (Sprint 8+)
    if (isNewLead) {
      try {
        await notifyNewLead({
          name: user.name,
          whatsapp: user.whatsapp,
          source: 'Site - Checkout',
        });
      } catch (e) {
        console.error('[customer] Lead notify error:', e);
      }
    }

    const lastOrder = user.orders[0];
    const defaultAddress = user.addresses[0] || lastOrder?.address;

    return NextResponse.json({
      ok: true,
      customer: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        email: user.email,
        cpfCnpj: user.cpfCnpj,
        address: defaultAddress || null,
        orderCount: user.orders.length,
        isFirstPurchase: user.orders.length === 0,
        isNewLead,
      },
    });
  } catch (e: any) {
    console.error('[customer/by-whatsapp] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message || 'Erro interno' }, { status: 500 });
  }
}
