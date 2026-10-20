// ============================================================
// API: Testar conexão Mercado Pago
// POST /api/admin/payments/test
// ============================================================

import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { mercadopagoLib, getActiveProvider } from '@/lib/payments';

export async function POST() {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 });
  }

  try {
    const provider = await getActiveProvider();

    if (provider === 'simulated') {
      return NextResponse.json({
        ok: false,
        error: 'Mercado Pago não configurado. Adicione as credenciais em /admin/configuracoes > Pagamentos',
      });
    }

    if (provider === 'mercadopago') {
      const result = await mercadopagoLib.testConnection();
      return NextResponse.json({
        ok: result.ok,
        mode: result.mode,
        error: result.error,
      });
    }

    return NextResponse.json({ ok: false, error: 'Provider desconhecido' });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e instanceof Error ? e.message : String(e)) }, { status: 500 });
  }
}
