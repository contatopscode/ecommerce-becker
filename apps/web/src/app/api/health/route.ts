// ============================================================
// Health check + info da app
// ============================================================

import { NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'becker-web',
    version: '0.1.0',
  };

  // Tenta pingar o DB
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.db = { status: 'ok', latencyMs: Date.now() - start };
    const count = await prisma.product.count();
    health.products = count;
  } catch (e: any) {
    health.db = { status: 'error', error: e.message };
  }

  return NextResponse.json(health);
}
