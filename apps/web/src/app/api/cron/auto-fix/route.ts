// ============================================================
// API: Auto-fix completo (diagnóstico + limpeza + migração)
// GET  /api/cron/auto-fix -> diagnóstico (mostra o que está duplicado)
// POST /api/cron/auto-fix -> limpa TUDO e roda prisma db push
// Autenticação: header x-cron-token
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from '@becker/db';
import { isValidCronToken } from '@/lib/backup';

const execAsync = promisify(exec);

async function getDuplicates() {
  const report: any[] = [];

  // Product.sku
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
      report.push({
        table: 'Product',
        column: 'sku',
        value: sku,
        count: list.length,
        items: list.map((p) => ({ id: p.id, name: p.name, slug: p.slug })),
      });
    }
  }

  // ProductVersion.sku
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
      report.push({
        table: 'ProductVersion',
        column: 'sku',
        value: sku,
        count: list.length,
        items: list.map((v) => ({ id: v.id, label: v.label, productId: v.productId })),
      });
    }
  }

  // User.whatsapp
  const usersByWhatsapp = await prisma.user.findMany({
    where: { whatsapp: { not: '' } },
    select: { id: true, whatsapp: true, name: true, role: true },
    orderBy: { id: 'asc' },
  });
  const whatsappMap = new Map<string, typeof usersByWhatsapp>();
  for (const u of usersByWhatsapp) {
    const list = whatsappMap.get(u.whatsapp) || [];
    list.push(u);
    whatsappMap.set(u.whatsapp, list);
  }
  for (const [whatsapp, list] of whatsappMap.entries()) {
    if (list.length > 1) {
      report.push({
        table: 'User',
        column: 'whatsapp',
        value: whatsapp,
        count: list.length,
        items: list.map((u) => ({ id: u.id, name: u.name, role: u.role })),
      });
    }
  }

  // User.email
  const usersByEmail = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { id: 'asc' },
  });
  const emailMap = new Map<string, typeof usersByEmail>();
  for (const u of usersByEmail) {
    if (!u.email) continue;
    const list = emailMap.get(u.email) || [];
    list.push(u);
    emailMap.set(u.email, list);
  }
  for (const [email, list] of emailMap.entries()) {
    if (list.length > 1) {
      report.push({
        table: 'User',
        column: 'email',
        value: email,
        count: list.length,
        items: list.map((u) => ({ id: u.id, name: u.name, role: u.role })),
      });
    }
  }

  return report;
}

async function cleanDuplicates() {
  const report: any[] = [];

  // Product.sku: mantém o primeiro, deleta os demais (com cascade)
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
        // Cascade manual: versions, images
        await prisma.productVersion.deleteMany({ where: { productId: p.id } });
        await prisma.productImage.deleteMany({ where: { productId: p.id } });
        await prisma.review.deleteMany({ where: { productId: p.id } });
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

  // ProductVersion.sku
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
        // Verifica se há OrderItem referenciando — se houver, não deleta (perderia histórico)
        const orderItemCount = await prisma.orderItem.count({
          where: { productVersionId: v.id },
        });
        if (orderItemCount > 0) {
          // Mantém o duplicado mas renomeia SKU
          const newSku = `${v.sku}-DUP-${v.id.slice(-6)}`;
          await prisma.productVersion.update({
            where: { id: v.id },
            data: { sku: newSku },
          });
          removed.push(`${v.label} (id: ${v.id}) -> SKU renomeado para ${newSku} (preservado por ter pedidos)`);
        } else {
          await prisma.productVersion.delete({ where: { id: v.id } });
          removed.push(`${v.label} (id: ${v.id})`);
        }
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

  // User.whatsapp: se tiver orders, preserva; senão deleta
  const users = await prisma.user.findMany({
    where: { whatsapp: { not: '' } },
    select: { id: true, whatsapp: true, name: true, role: true },
    orderBy: { id: 'asc' },
  });
  const whatsappMap = new Map<string, typeof users>();
  for (const u of users) {
    const list = whatsappMap.get(u.whatsapp) || [];
    list.push(u);
    whatsappMap.set(u.whatsapp, list);
  }
  for (const [whatsapp, list] of whatsappMap.entries()) {
    if (list.length > 1) {
      // Mantém o ADMIN, ou o que tem mais orders, ou o primeiro
      const [keep, ...toDelete] = list.sort((a, b) => {
        if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
        if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
        return a.id.localeCompare(b.id);
      });
      const removed: string[] = [];
      for (const u of toDelete) {
        const orderCount = await prisma.order.count({ where: { userId: u.id } });
        if (orderCount > 0) {
          // Preserva renomeando whatsapp
          const newWhatsapp = `${u.whatsapp}-DUP-${u.id.slice(-6)}`;
          await prisma.user.update({
            where: { id: u.id },
            data: { whatsapp: newWhatsapp },
          });
          removed.push(`${u.name} (id: ${u.id}) -> whatsapp renomeado (preservado por ter ${orderCount} pedidos)`);
        } else {
          await prisma.user.delete({ where: { id: u.id } });
          removed.push(`${u.name} (id: ${u.id})`);
        }
      }
      report.push({
        table: 'User',
        column: 'whatsapp',
        value: whatsapp,
        kept: `${keep.name} (id: ${keep.id}, role: ${keep.role})`,
        removed,
      });
    }
  }

  // User.email
  const usersByEmail = await prisma.user.findMany({
    where: { email: { not: null } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { id: 'asc' },
  });
  const emailMap = new Map<string, typeof usersByEmail>();
  for (const u of usersByEmail) {
    if (!u.email) continue;
    const list = emailMap.get(u.email) || [];
    list.push(u);
    emailMap.set(u.email, list);
  }
  for (const [email, list] of emailMap.entries()) {
    if (list.length > 1) {
      const [keep, ...toDelete] = list.sort((a, b) => {
        if (a.role === 'ADMIN' && b.role !== 'ADMIN') return -1;
        if (b.role === 'ADMIN' && a.role !== 'ADMIN') return 1;
        return a.id.localeCompare(b.id);
      });
      const removed: string[] = [];
      for (const u of toDelete) {
        const orderCount = await prisma.order.count({ where: { userId: u.id } });
        if (orderCount > 0) {
          const newEmail = `${u.email.split('@')[0]}+DUP-${u.id.slice(-6)}@${u.email.split('@')[1]}`;
          await prisma.user.update({
            where: { id: u.id },
            data: { email: newEmail },
          });
          removed.push(`${u.name} (id: ${u.id}) -> email renomeado (preservado por ter ${orderCount} pedidos)`);
        } else {
          await prisma.user.delete({ where: { id: u.id } });
          removed.push(`${u.name} (id: ${u.id})`);
        }
      }
      report.push({
        table: 'User',
        column: 'email',
        value: email,
        kept: `${keep.name} (id: ${keep.id}, role: ${keep.role})`,
        removed,
      });
    }
  }

  return report;
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  try {
    const duplicates = await getDuplicates();
    return NextResponse.json({
      ok: true,
      duplicatesCount: duplicates.length,
      duplicates,
    });
  } catch (e: any) {
    console.error('[auto-fix:GET] Erro:', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  try {
    console.log('[auto-fix:POST] Iniciando limpeza agressiva...');
    const cleanReport = await cleanDuplicates();
    console.log('[auto-fix:POST] Limpeza concluída. Aplicando migrations...');

    const { stdout, stderr } = await execAsync(
      'npx prisma db push --skip-generate --accept-data-loss',
      {
        cwd: '/app/packages/db',
        timeout: 120_000,
        env: { ...process.env, CI: 'true' },
      }
    );

    return NextResponse.json({
      ok: true,
      message: 'Limpeza + migration concluídas',
      cleanReport,
      migrateOutput: stdout + (stderr ? `\n--- stderr ---\n${stderr}` : ''),
    });
  } catch (e: any) {
    console.error('[auto-fix:POST] Erro:', e);
    return NextResponse.json({
      ok: false,
      error: e.message || 'Erro ao limpar/migrar',
      output: e.stdout || e.stderr || '',
    }, { status: 500 });
  }
}
