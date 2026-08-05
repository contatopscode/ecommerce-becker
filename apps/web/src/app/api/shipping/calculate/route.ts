// ============================================================
// API: Calcular frete
// POST /api/shipping/calculate
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { calculateShipping, getShippingConfig } from '@/lib/shipping';

export async function POST(req: NextRequest) {
  try {
    const { cep, items, orderTotal } = await req.json();

    if (!cep || !items?.length) {
      return NextResponse.json({ ok: false, error: 'CEP e itens obrigatórios' }, { status: 400 });
    }

    // Buscar versões com peso
    const versionIds = items.map((i: any) => i.versionId).filter(Boolean);
    const versions = await prisma.productVersion.findMany({
      where: { id: { in: versionIds } },
      select: { id: true, weight: true },
    });

    const weightMap = new Map(versions.map((v) => [v.id, v.weight || 500]));

    const itemsWithWeight = items.map((i: any) => ({
      weight: weightMap.get(i.versionId) || 500,
      qty: i.qty,
    }));

    const config = await getShippingConfig();
    const options = await calculateShipping(cep, itemsWithWeight, orderTotal, config);

    return NextResponse.json({ ok: true, options, config });
  } catch (e: any) {
    console.error('Shipping error:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
