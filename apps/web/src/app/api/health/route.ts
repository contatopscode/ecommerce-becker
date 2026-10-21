// ============================================================
// Health check + info da app
// ============================================================

import { NextResponse } from 'next/server';
import { prisma } from '@becker/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  let dbOk = true;
  const start = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (e) {
    dbOk = false;
    console.error('health: falha ao consultar o banco', e);
  }

  const dbStatus = dbOk ? 'ok' : 'error';

  return NextResponse.json(
    {
      status: dbStatus,
      service: 'becker-web',
      version: '0.1.0',
      commit: process.env.SOURCE_COMMIT ?? 'unknown',
      timestamp: new Date().toISOString(),
      db: { status: dbStatus, latencyMs: Date.now() - start },
    },
    { status: dbOk ? 200 : 503 },
  );
}
