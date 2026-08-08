// ============================================================
// 2FA - TOTP (Time-based One-Time Password)
// RFC 6238 - Compatível com Google Authenticator, Authy, etc
// ============================================================

import 'server-only';
import { authenticator } from 'otplib';
import crypto from 'crypto';
import { prisma } from '@becker/db';

// Configuração: 30 segundos, ±1 janela de tolerância
authenticator.options = {
  window: 1,
  step: 30,
};

const BACKUP_CODES_COUNT = 8;
const BACKUP_CODE_LENGTH = 8;
const APP_NAME = 'Becker Admin';

// ============== SECRET ==============

/**
 * Gera secret TOTP novo (Base32)
 */
export function generateSecret(): string {
  return authenticator.generateSecret();
}

/**
 * Gera URI otpauth:// para QR code
 */
export function getOTPAuthURI(secret: string, account: string): string {
  return authenticator.keyuri(account, APP_NAME, secret);
}

// ============== BACKUP CODES ==============

/**
 * Gera códigos de backup (8 códigos de 8 chars)
 */
export function generateBackupCodes(): { plain: string[]; hashed: string[] } {
  const plain: string[] = [];
  const hashed: string[] = [];

  for (let i = 0; i < BACKUP_CODES_COUNT; i++) {
    const code = crypto
      .randomBytes(BACKUP_CODE_LENGTH / 2)
      .toString('hex')
      .toUpperCase()
      .slice(0, BACKUP_CODE_LENGTH);
    plain.push(code);
    hashed.push(hashBackupCode(code));
  }

  return { plain, hashed };
}

/**
 * Hasheia código de backup
 */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(`becker-2fa:${code}`).digest('hex');
}

/**
 * Verifica e consome código de backup
 */
export async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorBackupCodes: true },
  });
  if (!user?.twoFactorBackupCodes) return false;

  const hashedCodes: string[] = JSON.parse(user.twoFactorBackupCodes);
  const inputHash = hashBackupCode(code.toUpperCase().trim());

  const index = hashedCodes.indexOf(inputHash);
  if (index === -1) return false;

  // Remove o código usado
  hashedCodes.splice(index, 1);
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorBackupCodes: JSON.stringify(hashedCodes) },
  });

  console.log(`[2fa] Backup code usado. Restantes: ${hashedCodes.length}`);
  return true;
}

// ============== VERIFY ==============

/**
 * Verifica código TOTP de 6 dígitos
 */
export function verifyTOTP(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

// ============== SETUP ==============

/**
 * Configura 2FA para um admin (gera secret + backup codes)
 * Retorna dados para exibir QR code + códigos de backup
 */
export async function setup2FA(userId: string): Promise<{
  secret: string;
  otpauth: string;
  backupCodes: string[];
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { whatsapp: true, name: true },
  });
  if (!user) throw new Error('Usuário não encontrado');

  const secret = generateSecret();
  const account = user.whatsapp || user.name;
  const otpauth = getOTPAuthURI(secret, account);
  const { plain, hashed } = generateBackupCodes();

  // Salva secret (mas só ativa após primeiro verify)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: secret,
      twoFactorBackupCodes: JSON.stringify(hashed),
    },
  });

  return { secret, otpauth, backupCodes: plain };
}

/**
 * Confirma setup verificando primeiro código TOTP
 * Se válido, marca como enabled
 */
export async function confirmSetup2FA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true },
  });
  if (!user?.twoFactorSecret) {
    throw new Error('Setup não iniciado');
  }

  if (!verifyTOTP(user.twoFactorSecret, token)) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });

  return true;
}

/**
 * Desativa 2FA
 */
export async function disable2FA(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    },
  });
}

/**
 * Verifica token TOTP durante login
 */
export async function verify2FA(userId: string, token: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return true; // 2FA não ativo
  }

  // Tenta TOTP primeiro
  if (verifyTOTP(user.twoFactorSecret, token)) {
    return true;
  }

  // Tenta backup code
  return await verifyBackupCode(userId, token);
}
