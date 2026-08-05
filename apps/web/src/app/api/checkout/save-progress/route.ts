// ============================================================
// API: Salvar progresso do checkout
// POST /api/checkout/save-progress
// Sprint 4: salva User e Address progressivamente
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { step, whatsapp, name, email, cep, street, number, complement, neighborhood, city, state } = data;

    if (!whatsapp || whatsapp.length < 10) {
      return NextResponse.json({ ok: false, error: 'WhatsApp inválido' }, { status: 400 });
    }

    const whatsappFormatted = `(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`;

    // 1. SEMPRE criar/atualizar User
    let user = await prisma.user.findFirst({
      where: { whatsapp: { in: [whatsappFormatted, whatsapp] } },
    });

    if (!user) {
      const id = randomBytes(12).toString('hex');
      user = await prisma.user.create({
        data: {
          id,
          name: name || `Cliente ${whatsapp.slice(-4)}`,
          whatsapp: whatsappFormatted,
          email: email || null,
          role: 'CUSTOMER',
        },
      });
    } else if (name && (step === 1 || !user.name.startsWith('Cliente'))) {
      // Atualiza nome se informado e ainda tem nome placeholder
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name, email: email || user.email },
      });
    } else if (email && email !== user.email) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { email },
      });
    }

    // 2. STEP 2 (Endereço) — salvar/atualizar Address
    if (step >= 2 && cep && street && number && neighborhood && city && state) {
      const cleanedCep = cep.replace(/\D/g, '');

      // Tentar achar address existente pro mesmo CEP+rua+número
      let address = await prisma.address.findFirst({
        where: {
          userId: user.id,
          cep: cleanedCep,
          street,
          number,
        },
      });

      if (!address) {
        // Marcar todos como não-default, depois criar o novo como default
        await prisma.address.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });

        const id = randomBytes(12).toString('hex');
        address = await prisma.address.create({
          data: {
            id,
            userId: user.id,
            cep: cleanedCep,
            street,
            number,
            complement: complement || null,
            district: neighborhood,
            city,
            state,
            isDefault: true,
          },
        });
      } else {
        // Atualizar (caso tenha mudado complemento ou similar)
        address = await prisma.address.update({
          where: { id: address.id },
          data: {
            complement: complement || null,
            district: neighborhood,
            city,
            state,
            isDefault: true,
          },
        });
      }

      return NextResponse.json({ ok: true, userId: user.id, addressId: address.id });
    }

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (e: any) {
    console.error('[save-progress] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
