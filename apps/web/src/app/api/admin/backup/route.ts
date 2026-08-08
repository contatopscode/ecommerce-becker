// ============================================================
// API: Backup do banco
// POST /api/admin/backup - Executa novo backup
// GET /api/admin/backup - Lista backups existentes
// Autenticação: header x-cron-token (CRON_TOKEN env var)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { runBackup, listBackups, isValidCronToken } from '@/lib/backup';

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  const result = await runBackup();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}

export async function GET(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  const backups = await listBackups();
  return NextResponse.json({
    ok: true,
    backups: backups.map((b) => ({
      filename: b.filename,
      sizeBytes: b.sizeBytes,
      sizeMB: (b.sizeBytes / 1024 / 1024).toFixed(2),
      createdAt: b.createdAt.toISOString(),
    })),
    count: backups.length,
  });
}
