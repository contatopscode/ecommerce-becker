// ============================================================
// API: Aplicar migrations do Prisma manualmente
// POST /api/admin/migrate
// Autenticação: sessão admin
// Executa: prisma db push --accept-data-loss
// Uso: quando o start.sh não funcionou (Easypanel pode não rebuildar)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getSession } from '@/lib/auth/session';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 });
  }

  try {
    // Executa prisma db push
    // --skip-generate: não regenera o Prisma Client
    // --accept-data-loss: aceita perda de dados (não é o ideal, mas resolve)
    const { stdout, stderr } = await execAsync(
      'npx prisma db push --skip-generate --accept-data-loss',
      {
        cwd: '/app/packages/db',
        timeout: 60_000,
        env: { ...process.env, CI: 'true' },
      }
    );

    console.log('[migrate] stdout:', stdout);
    if (stderr) console.log('[migrate] stderr:', stderr);

    return NextResponse.json({
      ok: true,
      message: 'Schema aplicado com sucesso',
      output: stdout + (stderr ? `\n--- stderr ---\n${stderr}` : ''),
    });
  } catch (e: any) {
    console.error('[migrate] Erro:', e);
    return NextResponse.json({
      ok: false,
      error: e.message || 'Erro ao aplicar schema',
      output: e.stdout || e.stderr || '',
    }, { status: 500 });
  }
}

// GET também disponível para testar se está funcionando
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ ok: false, error: 'Sem permissão' }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    message: 'POST /api/admin/migrate para aplicar schema do Prisma',
  });
}
