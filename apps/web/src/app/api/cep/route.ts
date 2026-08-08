// ============================================================
// API: Buscar endereço por CEP (ViaCEP)
// GET /api/cep?cep=01310100
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchAddressByCep } from '@/lib/viacep';
import { checkRateLimit, LIMITS } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // Rate limit: 30 req / min por IP
  const limited = checkRateLimit(req, LIMITS.CEP_LOOKUP);
  if (limited) return limited;

  const cep = req.nextUrl.searchParams.get('cep') || '';
  const address = await fetchAddressByCep(cep);

  if (!address) {
    return NextResponse.json({ ok: false, error: 'CEP não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, address });
}
