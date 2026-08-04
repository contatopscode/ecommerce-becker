// ============================================================
// API: Solicitar código OTP
// POST /api/auth/otp/request { whatsapp }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { requestOTP } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const { whatsapp } = await req.json();
    const result = await requestOTP(whatsapp);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
