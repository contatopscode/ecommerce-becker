// ============================================================
// API: Emergency Login (admin/dev)
// POST /api/auth/emergency-login
// Autenticação: header x-cron-token
// Cria sessão direto sem precisar de OTP
// Uso: quando o admin está travado e não consegue logar via OTP
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { isValidCronToken } from '@/lib/backup';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  // Protegido por token de cron
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  try {
    const { whatsapp } = await req.json();

    if (!whatsapp) {
      return NextResponse.json({ ok: false, error: 'WhatsApp obrigatório' }, { status: 400 });
    }

    const cleaned = whatsapp.replace(/\D/g, '');
    if (cleaned.length < 10) {
      return NextResponse.json({ ok: false, error: 'WhatsApp inválido' }, { status: 400 });
    }

    const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

    // Encontra usuário
    let user = await prisma.user.findFirst({
      where: { whatsapp: { in: [fullPhone, whatsapp] } },
    });

    if (!user) {
      // Cria usuário (pra primeira vez)
      user = await prisma.user.create({
        data: {
          whatsapp: fullPhone,
          name: `Admin ${fullPhone.slice(-4)}`,
          role: 'ADMIN', // emergency login só pra admin
        },
      });
    }

    // Verifica se é admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        ok: false,
        error: `Usuário ${fullPhone} tem role ${user.role}. Emergency login só funciona pra ADMIN/SUPER_ADMIN. Atualize o role via SQL ou DB.`,
      }, { status: 403 });
    }

    // Cria sessão
    const sessionData = {
      userId: user.id,
      role: user.role,
      whatsapp: user.whatsapp || fullPhone,
      name: user.name,
    };

    await setSessionCookie(sessionData);

    console.log(`[emergency-login] Sessão criada para ${user.name} (${user.role})`);

    return NextResponse.json({
      ok: true,
      message: 'Sessão criada! Você já pode acessar /admin',
      session: sessionData,
    });
  } catch (e: unknown) {
    console.error('[emergency-login] Erro:', e);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}
