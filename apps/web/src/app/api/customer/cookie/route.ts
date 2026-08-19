// ============================================================
// API: Customer cookie (1-clique support)
// POST /api/customer/cookie
//   body: { whatsapp: "81999998888", name?: "Paulo" }
//   → seta cookie becker_whatsapp_hint por 30 dias
//   → retorna { ok, customer: { id, name, orderCount, hasAddress } }
// DELETE /api/customer/cookie
//   → remove o cookie
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';

const COOKIE_NAME = 'becker_whatsapp_hint';
const HINT_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export const dynamic = 'force-dynamic';

function digitsOnly(s: string) {
  return (s || '').replace(/\D/g, '');
}

function formatWhatsApp(digits: string) {
  const v = digits.slice(0, 11);
  if (v.length <= 2) return v;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const whatsapp = digitsOnly(String(body.whatsapp || ''));
    const name = typeof body.name === 'string' ? body.name.trim() : undefined;

    if (whatsapp.length < 10 || whatsapp.length > 11) {
      return NextResponse.json(
        { ok: false, error: 'WhatsApp inválido (precisa 10-11 dígitos)' },
        { status: 400 }
      );
    }

    // Tenta enriquecer com dados do DB (opcional — best-effort)
    let customer: {
      id: string;
      name: string;
      orderCount: number;
      hasAddress: boolean;
    } | null = null;

    try {
      const whatsappFormatted = formatWhatsApp(whatsapp);
      const formats = [
        whatsappFormatted,
        `(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 6)}-${whatsapp.slice(6)}`,
        `(${whatsapp.slice(0, 2)})9${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`,
        whatsapp,
        `55${whatsapp}`,
      ];

      const user = await prisma.user.findFirst({
        where: { whatsapp: { in: formats } },
        include: {
          addresses: { where: { isDefault: true }, take: 1 },
          _count: { select: { orders: true } },
        },
      });

      if (user) {
        customer = {
          id: user.id,
          name: user.name,
          orderCount: user._count.orders,
          hasAddress: !!user.addresses[0]?.cep,
        };
      }
    } catch (e) {
      // best-effort: cookie é gravado mesmo se DB falhar
      console.error('[customer/cookie] DB lookup error:', e);
    }

    const hint = {
      whatsapp,
      name: name || customer?.name,
      savedAt: Date.now(),
    };

    const res = NextResponse.json({
      ok: true,
      hint: { whatsapp: hint.whatsapp, name: hint.name },
      customer,
    });

    // Cookie visível no client (httpOnly: false) pra UI reagir
    // SameSite=Lax permite navegação top-level
    res.cookies.set(COOKIE_NAME, JSON.stringify(hint), {
      maxAge: HINT_MAX_AGE,
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
    });

    return res;
  } catch (e: any) {
    console.error('[customer/cookie] POST error:', e);
    return NextResponse.json(
      { ok: false, error: e.message || 'Erro interno' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', {
    maxAge: 0,
    path: '/',
    sameSite: 'lax',
  });
  return res;
}
