// ============================================================
// API: Buscar cliente + último endereço por WhatsApp
// GET /api/customer/by-whatsapp?whatsapp=81999998888
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export async function GET(req: NextRequest) {
  const whatsapp = (req.nextUrl.searchParams.get('whatsapp') || '').replace(/\D/g, '');

  if (whatsapp.length < 10) {
    return NextResponse.json({ ok: false, error: 'WhatsApp inválido' }, { status: 400 });
  }

  // Buscar formatos comuns
  const formats = [
    `(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`,
    `(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 6)}-${whatsapp.slice(6)}`,
    `(${whatsapp.slice(0, 2)})9${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`,
    whatsapp,
  ];

  const user = await prisma.user.findFirst({
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

  if (!user) {
    return NextResponse.json({
      ok: true,
      customer: null,
      message: 'Cliente não cadastrado',
    });
  }

  // Pega endereço do último pedido OU endereço padrão
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
    },
  });
}
