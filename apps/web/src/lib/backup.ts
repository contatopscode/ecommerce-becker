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
  const filename = `becker_${timestamp}.sql.gz`;
  const filepath = path.join(BACKUP_DIR, filename);

  // Garante que diretório existe
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  try {
    // Executa pg_dump
    const env = { ...process.env, PGPASSWORD: dbPass };
    const command = `pg_dump -h ${dbHost} -p ${port} -U ${dbUser} -d ${dbName} --no-owner --no-privileges --clean --if-exists | gzip > "${filepath}"`;

    await execAsync(command, { env, maxBuffer: 100 * 1024 * 1024 });

    // Verifica tamanho
    const stats = await fs.stat(filepath);

    if (stats.size === 0) {
      await fs.unlink(filepath).catch(() => {});
      return { ok: false, error: 'Backup gerado vazio' };
    }

    // Limpa backups antigos
    await cleanOldBackups();

    console.log(`[backup] ✅ Backup criado: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);

    return {
      ok: true,
      filename,
      sizeBytes: stats.size,
      timestamp: new Date().toISOString(),
    };
  } catch (e: any) {
    console.error('[backup] ❌ Erro:', e.message);
    // Remove arquivo parcial se existir
    await fs.unlink(filepath).catch(() => {});
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
 * Valida token de autorização
 */
export function isValidBackupToken(token: string | null): boolean {
  const expected = process.env.BACKUP_TOKEN;
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
