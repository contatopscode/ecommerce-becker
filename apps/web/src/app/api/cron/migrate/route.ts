// ============================================================
// API: Aplicar migrations via cron (sem precisar de login)
// POST /api/cron/migrate
// Autenticação: header x-cron-token
// Uso: destravar DB quando admin não consegue logar
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { isValidCronToken } from '@/lib/backup';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-cron-token');
  if (!isValidCronToken(token)) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  try {
    console.log('[cron/migrate] Aplicando schema do Prisma...');

    const { stdout, stderr } = await execAsync(
      'npx prisma db push --skip-generate --accept-data-loss',
      {
        cwd: '/app/packages/db',
        timeout: 120_000,
        env: { ...process.env, CI: 'true' },
      }
    );

    console.log('[cron/migrate] stdout:', stdout);

    return NextResponse.json({
      ok: true,
      message: 'Schema aplicado com sucesso',
      output: stdout + (stderr ? `\n--- stderr ---\n${stderr}` : ''),
    });
  } catch (e: any) {
    console.error('[cron/migrate] Erro:', e);
    return NextResponse.json({
      ok: false,
      error: e.message || 'Erro ao aplicar schema',
      output: e.stdout || e.stderr || '',
    }, { status: 500 });
  }
}
