// ============================================================
// API: Verificar código OTP e criar sessão
// POST /api/auth/otp/verify { whatsapp, code }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';
import { verifyOTP } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, LIMITS.OTP_VERIFY, 'otp-verify');
  if (limited) return limited;

  try {
    const { whatsapp, code } = await req.json();
    const result = await verifyOTP(whatsapp, code);
    return NextResponse.json(result, { status: result.rateLimited ? 429 : 200 });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e instanceof Error ? e.message : String(e)) }, { status: 400 });
  }
}
