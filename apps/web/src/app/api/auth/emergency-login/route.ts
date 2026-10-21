// ============================================================
// API: Emergency Login (admin/dev)
// POST /api/auth/emergency-login
// Autenticação: header x-cron-token
// Cria sessão direto sem precisar de OTP
// Uso: quando o admin está travado e não consegue logar via OTP
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import crypto from 'crypto';
import { checkRateLimit } from '@/lib/rate-limit';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  // Rate limit por IP: 5 req / 15 min
  const limited = checkRateLimit(req, { max: 5, windowMs: 15 * 60 * 1000 }, 'emergency-login');
  if (limited) return limited;

  // Protegido por token de cron (comparação em tempo constante)
  const expected = process.env.CRON_TOKEN;
  const given = req.headers.get('x-cron-token');
  const a = Buffer.from(given ?? '');
  const b = Buffer.from(expected ?? '');
  if (!expected || !given || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
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
    const user = await prisma.user.findFirst({
      where: { whatsapp: { in: [fullPhone, whatsapp] } },
    });

    // Nunca cria usuário: só entra quem já existe como admin
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Verifica se é admin
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        ok: false,
        error: 'Emergency login só funciona para ADMIN/SUPER_ADMIN.',
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
    console.error('[emergency-login] Erro:', e instanceof Error ? e.message : 'desconhecido');
    return NextResponse.json({ ok: false, error: 'Erro interno' }, { status: 500 });
  }
}
