// ============================================================
// API: Solicitar código OTP
// POST /api/auth/otp/request { whatsapp }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requestOTP } from '@/lib/auth/session';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: 5 req / 15 min por IP
  const limited = checkRateLimit(req, LIMITS.OTP_REQUEST);
  if (limited) return limited;

  try {
    const { whatsapp } = await req.json();
    const result = await requestOTP(whatsapp);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
