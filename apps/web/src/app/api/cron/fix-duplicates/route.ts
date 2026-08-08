// ============================================================
// API: Limpar SKUs duplicados (resolve conflito de db push)
// POST /api/cron/fix-duplicates
// Autenticação: header x-cron-token
// Para cada SKU duplicado, mantém o primeiro e deleta o resto
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { isValidCronToken } from '@/lib/backup';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  try {
    // Encontra SKUs duplicados em ProductVersion
    const allVersions = await prisma.productVersion.findMany({
      select: { id: true, sku: true, productId: true, label: true, price: true },
      orderBy: { id: 'asc' },
    });

    const skuMap = new Map<string, typeof allVersions>();
    for (const v of allVersions) {
      const list = skuMap.get(v.sku) || [];
      list.push(v);
      skuMap.set(v.sku, list);
    }

    const duplicates = Array.from(skuMap.entries()).filter(([_, list]) => list.length > 1);

    if (duplicates.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Nenhum SKU duplicado encontrado',
        duplicates: [],
      });
    }

    const deleted: string[] = [];
    for (const [sku, list] of duplicates) {
      // Mantém o primeiro, deleta o resto
      const [keep, ...toDelete] = list;
      for (const v of toDelete) {
        await prisma.productVersion.delete({ where: { id: v.id } });
        deleted.push(`${sku} (id: ${v.id}, product: ${v.productId})`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${deleted.length} versões duplicadas removidas`,
      deleted,
    });
  } catch (e: any) {
    console.error('[fix-duplicates] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
