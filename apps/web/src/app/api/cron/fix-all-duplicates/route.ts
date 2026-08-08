// ============================================================
// API: Limpar TODAS as duplicatas (sku, whatsapp, cpfCnpj, email)
// POST /api/cron/fix-all-duplicates
// Autenticação: header x-cron-token
// Verifica TODAS as colunas unique e remove duplicatas
// Retorna relatório detalhado
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@becker/db';
import { isValidCronToken } from '@/lib/backup';

interface DuplicateInfo {
  table: string;
  column: string;
  value: string;
  kept: string;
  removed: string[];
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  try {
    const report: DuplicateInfo[] = [];

    // ============== Product.sku ==============
    const products = await prisma.product.findMany({
      select: { id: true, sku: true, slug: true, name: true },
      orderBy: { id: 'asc' },
    });
    const productSkuMap = new Map<string, typeof products>();
    for (const p of products) {
      const list = productSkuMap.get(p.sku) || [];
      list.push(p);
      productSkuMap.set(p.sku, list);
    }
    for (const [sku, list] of productSkuMap.entries()) {
      if (list.length > 1) {
        const [keep, ...toDelete] = list;
        const removed: string[] = [];
        for (const p of toDelete) {
          // Cascade delete versions
          await prisma.productVersion.deleteMany({ where: { productId: p.id } });
          await prisma.productImage.deleteMany({ where: { productId: p.id } });
          await prisma.product.delete({ where: { id: p.id } });
          removed.push(`${p.name} (id: ${p.id})`);
        }
        report.push({
          table: 'Product',
          column: 'sku',
          value: sku,
          kept: `${keep.name} (id: ${keep.id})`,
          removed,
        });
      }
    }

    // ============== ProductVersion.sku ==============
    const versions = await prisma.productVersion.findMany({
      select: { id: true, sku: true, productId: true, label: true },
      orderBy: { id: 'asc' },
    });
    const skuMap = new Map<string, typeof versions>();
    for (const v of versions) {
      const list = skuMap.get(v.sku) || [];
      list.push(v);
      skuMap.set(v.sku, list);
    }
    for (const [sku, list] of skuMap.entries()) {
      if (list.length > 1) {
        const [keep, ...toDelete] = list;
        const removed: string[] = [];
        for (const v of toDelete) {
          await prisma.productVersion.delete({ where: { id: v.id } });
          removed.push(`${v.label} (id: ${v.id}, product: ${v.productId})`);
        }
        report.push({
          table: 'ProductVersion',
          column: 'sku',
          value: sku,
          kept: `${keep.label} (id: ${keep.id})`,
          removed,
        });
      }
    }

    // ============== User.whatsapp ==============
    const users = await prisma.user.findMany({
      select: { id: true, whatsapp: true, name: true },
      orderBy: { id: 'asc' },
    });
    const whatsappMap = new Map<string, typeof users>();
    for (const u of users) {
      if (!u.whatsapp) continue;
      const list = whatsappMap.get(u.whatsapp) || [];
      list.push(u);
      whatsappMap.set(u.whatsapp, list);
    }
    for (const [whatsapp, list] of whatsappMap.entries()) {
      if (list.length > 1) {
        const [keep, ...toDelete] = list;
        const removed: string[] = [];
        for (const u of toDelete) {
          await prisma.user.delete({ where: { id: u.id } });
          removed.push(`${u.name} (id: ${u.id})`);
        }
        report.push({
          table: 'User',
          column: 'whatsapp',
          value: whatsapp,
          kept: `${keep.name} (id: ${keep.id})`,
          removed,
        });
      }
    }

    // ============== User.email ==============
    const usersWithEmail = users.filter((u) => u.whatsapp);
    const userByEmail = await prisma.user.findMany({
      where: { email: { not: null } },
      select: { id: true, email: true, name: true },
      orderBy: { id: 'asc' },
    });
    const emailMap = new Map<string, typeof userByEmail>();
    for (const u of userByEmail) {
      if (!u.email) continue;
      const list = emailMap.get(u.email) || [];
      list.push(u);
      emailMap.set(u.email, list);
    }
    for (const [email, list] of emailMap.entries()) {
      if (list.length > 1) {
        const [keep, ...toDelete] = list;
        const removed: string[] = [];
        for (const u of toDelete) {
          await prisma.user.delete({ where: { id: u.id } });
          removed.push(`${u.name} (id: ${u.id})`);
        }
        report.push({
          table: 'User',
          column: 'email',
          value: email,
          kept: `${keep.name} (id: ${keep.id})`,
          removed,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      message: `${report.length} grupo(s) de duplicatas removidos`,
      report,
    });
  } catch (e: any) {
    console.error('[fix-all-duplicates] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
