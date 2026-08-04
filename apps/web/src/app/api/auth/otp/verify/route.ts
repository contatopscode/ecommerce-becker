// ============================================================
// API: Verificar código OTP e criar sessão
// POST /api/auth/otp/verify { whatsapp, code }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { whatsapp, code } = await req.json();
    const result = await verifyOTP(whatsapp, code);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
