// ============================================================
// Backup automático do PostgreSQL
// ============================================================

import 'server-only';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);

export interface BackupResult {
  ok: boolean;
  filename?: string;
  sizeBytes?: number;
  error?: string;
  timestamp?: string;
}

export interface BackupInfo {
  filename: string;
  sizeBytes: number;
  createdAt: Date;
}

/**
 * Faz backup do banco via pg_dump
 *
 * Bug fix 2026-08-09: a versão anterior usava `pg_dump | gzip > file`, que
 * silenciava erros do pg_dump (gzip criava header de 20 bytes mesmo com
 * input vazio e exit code 0). Agora: pg_dump escreve direto em .sql,
 * validamos tamanho mínimo, depois gzipamos. stderr é capturado pra
 * diagnóstico.
 */
export async function runBackup(): Promise<BackupResult> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return { ok: false, error: 'DATABASE_URL não configurada' };
  }

  // Parse URL: postgresql://user:pass@host:port/db?params
  const match = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:/]+):?(\d*)\/([^?]+)(.*)?/);
  if (!match) {
    return { ok: false, error: 'DATABASE_URL inválida' };
  }

  const [, dbUser, dbPass, dbHost, dbPort, dbName] = match;
  const port = dbPort || '5432';
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const baseName = `becker_${timestamp}`;
  const sqlFile = path.join(BACKUP_DIR, `${baseName}.sql`);
  const gzFile = path.join(BACKUP_DIR, `${baseName}.sql.gz`);

  // Garante que diretório existe
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  // Sanity check: pg_dump disponível?
  try {
    const { stdout: pgVer } = await execAsync('pg_dump --version');
    console.log(`[backup] pg_dump: ${pgVer.trim()}`);
  } catch (e: any) {
    return { ok: false, error: `pg_dump não disponível no PATH: ${e.message}` };
  }

  try {
    // 1) pg_dump escreve direto em .sql (sem pipe) — exit code é real
    const env = { ...process.env, PGPASSWORD: dbPass };
    const dumpCmd = `pg_dump -h ${dbHost} -p ${port} -U ${dbUser} -d ${dbName} --no-owner --no-privileges --clean --if-exists -f "${sqlFile}"`;

    let dumpStderr = '';
    try {
      const result = await execAsync(dumpCmd, { env, maxBuffer: 100 * 1024 * 1024 });
      dumpStderr = result.stderr || '';
    } catch (e: any) {
      // Captura stderr real (em vez de mascarar com pipe)
      const stderr = e.stderr || e.stdout || e.message;
      await fs.unlink(sqlFile).catch(() => {});
      return {
        ok: false,
        error: `pg_dump falhou: ${stderr}`.slice(0, 500),
      };
    }

    // 2) Valida que o .sql tem conteúdo real
    const sqlStats = await fs.stat(sqlFile);
    if (sqlStats.size < 1024) {
      await fs.unlink(sqlFile).catch(() => {});
      return {
        ok: false,
        error: `pg_dump gerou arquivo suspeito (${sqlStats.size} bytes). stderr: ${dumpStderr.slice(0, 300)}`,
      };
    }

    // 3) Gzipa o .sql -> .sql.gz
    await execAsync(`gzip -f "${sqlFile}"`);

    // gzip -f remove o .sql e cria .sql.gz
    const gzStats = await fs.stat(gzFile);
    if (gzStats.size < 100) {
      await fs.unlink(gzFile).catch(() => {});
      return { ok: false, error: `gzip produziu arquivo pequeno demais (${gzStats.size} bytes)` };
    }

    // 4) Limpa backups antigos
    await cleanOldBackups();

    console.log(
      `[backup] ✅ ${baseName}.sql.gz (${(gzStats.size / 1024 / 1024).toFixed(2)}MB) | stderr: ${dumpStderr.slice(0, 100) || 'limpo'}`
    );

    return {
      ok: true,
      filename: `${baseName}.sql.gz`,
      sizeBytes: gzStats.size,
      timestamp: new Date().toISOString(),
    };
  } catch (e: any) {
    console.error('[backup] ❌ Erro:', e.message);
    await fs.unlink(sqlFile).catch(() => {});
    await fs.unlink(gzFile).catch(() => {});
    return { ok: false, error: e.message };
  }
}

/**
 * Lista backups existentes
 */
export async function listBackups(): Promise<BackupInfo[]> {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    const files = await fs.readdir(BACKUP_DIR);
    const backups: BackupInfo[] = [];

    for (const file of files) {
      if (!file.startsWith('becker_') || !file.endsWith('.sql.gz')) continue;
      const filepath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filepath);
      backups.push({
        filename: file,
        sizeBytes: stats.size,
        createdAt: stats.mtime,
      });
    }

    return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (e: any) {
    console.error('[backup] Erro ao listar:', e.message);
    return [];
  }
}

/**
 * Remove backups com mais de RETENTION_DAYS dias
 */
async function cleanOldBackups(): Promise<void> {
  try {
    const cutoffMs = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const backups = await listBackups();
    for (const b of backups) {
      if (b.createdAt.getTime() < cutoffMs) {
        await fs.unlink(path.join(BACKUP_DIR, b.filename));
        console.log(`[backup] 🧹 Removido backup antigo: ${b.filename}`);
      }
    }
  } catch (e: any) {
    console.error('[backup] Erro na limpeza:', e.message);
  }
}

/**
 * Valida token de autorização para jobs internos (cron, webhooks, etc)
 * Variável de ambiente: CRON_TOKEN
 *
 * Usado para autenticar chamadas internas feitas por:
 * - Cron jobs (mavis, Easypanel, cron-job.org)
 * - Webhooks internos
 * - Qualquer serviço automatizado que precisa chamar a API
 *
 * NÃO confundir com tokens de integração externa (Evolution API, Mercado Pago, etc)
 * que têm suas próprias variáveis (EVOLUTION_API_KEY, MERCADOPAGO_ACCESS_TOKEN, etc).
 */
export function isValidCronToken(token: string | null): boolean {
  const expected = process.env.CRON_TOKEN;
  if (!expected) return false;
  if (!token) return false;
  // Comparação de tempo constante para evitar timing attacks
  if (token.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < token.length; i++) {
    mismatch |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
