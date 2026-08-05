// ============================================================
// API: Buscar endereço por CEP (ViaCEP)
// GET /api/cep?cep=01310100
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { fetchAddressByCep } from '@/lib/viacep';

export async function GET(req: NextRequest) {
  const cep = req.nextUrl.searchParams.get('cep') || '';
  const address = await fetchAddressByCep(cep);

  if (!address) {
    return NextResponse.json({ ok: false, error: 'CEP não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, address });
}
