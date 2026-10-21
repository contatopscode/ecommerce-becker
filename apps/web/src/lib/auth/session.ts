// ============================================================
// Auth - Login OTP via WhatsApp
// Sistema simples baseado em cookie httpOnly
// ============================================================

import 'server-only';
import { cookies } from 'next/headers';
import { prisma } from '@becker/db';
import { sendWhatsApp } from '@/lib/whatsapp-client';
import crypto from 'crypto';
import { getSecret, signValue, verifyValue } from '@/lib/auth/signed-cookie';

const SESSION_COOKIE = 'becker_session';
const OTP_COOKIE = 'becker_otp';
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 dias
const OTP_DURATION = 10 * 60; // 10 minutos
const OTP_LENGTH = 6;

export interface Session {
  userId: string;
  role: string;
  whatsapp: string;
  name: string;
}

// ============== OTP ==============
const OTP_WINDOW_MS = OTP_DURATION * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_REQUESTS = 3;
const OTP_TOO_MANY = 'Muitas tentativas. Solicite um novo código';

export interface OtpResult {
  ok: boolean;
  error?: string;
  code?: string;
  rateLimited?: boolean;
}

function generateOTP(): string {
  const buffer = crypto.randomBytes(4);
  const num = parseInt(buffer.toString('hex'), 16) % 1_000_000;
  return String(num).padStart(OTP_LENGTH, '0');
}

function hashOTP(otp: string, whatsapp: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`${otp}:${whatsapp}`).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return ba.length === bb.length && ba.length > 0 && crypto.timingSafeEqual(ba, bb);
}

/** Identificador do número para chaves no banco: nunca o número cru. */
function phoneKey(whatsapp: string): string {
  return crypto.createHash('sha256').update(whatsapp).digest('hex');
}

interface Counter {
  count: number;
  resetAt: number;
}

function parseCounter(value: string): Counter | null {
  try {
    const v: unknown = JSON.parse(value);
    if (typeof v === 'object' && v !== null) {
      const { count, resetAt } = v as Record<string, unknown>;
      if (typeof count === 'number' && typeof resetAt === 'number') return { count, resetAt };
    }
  } catch {
    /* valor corrompido: trata como ausente */
  }
  return null;
}

/**
 * Conta um uso na chave (janela fixa) dentro de transação serializável.
 * Devolve false quando o limite já foi atingido (sem incrementar). Falha fechada.
 */
async function consumeCounter(key: string, max: number, windowMs: number): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const now = Date.now();
          const row = await tx.setting.findUnique({ where: { key } });
          const cur = row ? parseCounter(row.value) : null;
          if (!cur || cur.resetAt <= now) {
            const fresh = JSON.stringify({ count: 1, resetAt: now + windowMs });
            await tx.setting.upsert({
              where: { key },
              create: { key, value: fresh, category: 'auth' },
              update: { value: fresh },
            });
            return true;
          }
          if (cur.count >= max) return false;
          await tx.setting.update({
            where: { key },
            data: { value: JSON.stringify({ count: cur.count + 1, resetAt: cur.resetAt }) },
          });
          return true;
        },
        { isolationLevel: 'Serializable' },
      );
    } catch {
      /* conflito de serialização: tenta de novo */
    }
  }
  return false;
}

function isUniqueViolation(e: unknown): boolean {
  return typeof e === 'object' && e !== null && 'code' in e && (e as { code?: unknown }).code === 'P2002';
}

/** Remove registros otp.* antigos (oportunista, falha silenciosa). */
async function cleanupOtpRecords(): Promise<void> {
  try {
    await prisma.setting.deleteMany({
      where: { key: { startsWith: 'otp.' }, updatedAt: { lt: new Date(Date.now() - 2 * OTP_WINDOW_MS) } },
    });
  } catch {
    /* limpeza é best-effort */
  }
}

/**
 * Solicita código OTP. Envia por WhatsApp via Evolution API.
 */
export async function requestOTP(whatsapp: string): Promise<OtpResult> {
  // Normalizar
  const cleaned = whatsapp.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 13) {
    return { ok: false, error: 'WhatsApp inválido' };
  }
  const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  const pk = phoneKey(fullPhone);

  void cleanupOtpRecords();

  // Máx. 3 pedidos por número a cada 10 min
  if (!(await consumeCounter(`otp.requests.${pk}`, OTP_MAX_REQUESTS, OTP_WINDOW_MS))) {
    return { ok: false, error: 'Muitos pedidos de código. Aguarde alguns minutos.', rateLimited: true };
  }

  // Novo código zera as tentativas do anterior
  await prisma.setting.deleteMany({ where: { key: `otp.attempts.${pk}` } });

  // Gerar código
  const code = generateOTP();
  const hash = hashOTP(code, fullPhone);
  const nonce = crypto.randomBytes(16).toString('hex');

  // Salvar no cookie (temporário)
  const cookieStore = await cookies();
  cookieStore.set(OTP_COOKIE, signValue('otp', { whatsapp: fullPhone, hash, nonce }, OTP_DURATION), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: OTP_DURATION,
    path: '/',
  });

  // Enviar por WhatsApp
  try {
    const message = `🔐 *Becker* - Código de acesso\n\nSeu código: *${code}*\n\nVálido por 10 minutos.\n\nSe não foi você, ignore.`;
    const result = await sendWhatsApp({ number: fullPhone, text: message });
    if (!result.success) {
      console.error('Erro ao enviar OTP:', result.error);
      // Em dev, retornamos o código pra teste
      if (process.env.NODE_ENV !== 'production') {
        return { ok: true, code };
      }
      return { ok: false, error: 'Erro ao enviar código' };
    }
    return { ok: true };
  } catch (e: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      return { ok: true, code };
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Verifica código OTP e cria sessão se válido.
 * Limite de 5 tentativas por número a cada 10 min (no servidor); OTP de uso único.
 */
export async function verifyOTP(
  whatsapp: string,
  code: string,
): Promise<OtpResult & { session?: Session }> {
  const cleaned = whatsapp.replace(/\D/g, '');
  const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

  const cookieStore = await cookies();
  const otpCookie = cookieStore.get(OTP_COOKIE);
  if (!otpCookie) return { ok: false, error: 'Código expirado. Solicite um novo.' };

  const data = verifyValue('otp', otpCookie.value);
  if (
    !data ||
    typeof data.whatsapp !== 'string' ||
    typeof data.hash !== 'string' ||
    typeof data.nonce !== 'string'
  ) {
    cookieStore.delete(OTP_COOKIE);
    return { ok: false, error: 'Código expirado ou inválido. Solicite um novo.' };
  }

  if (data.whatsapp !== fullPhone) {
    return { ok: false, error: 'WhatsApp não confere' };
  }

  // Conta a tentativa ANTES de comparar
  const pk = phoneKey(fullPhone);
  if (!(await consumeCounter(`otp.attempts.${pk}`, OTP_MAX_ATTEMPTS, OTP_WINDOW_MS))) {
    return { ok: false, error: OTP_TOO_MANY, rateLimited: true };
  }

  if (typeof code !== 'string' || !safeEqualHex(hashOTP(code, fullPhone), data.hash)) {
    return { ok: false, error: 'Código inválido' };
  }

  // Uso único: o nonce só pode ser consumido uma vez
  try {
    await prisma.setting.create({
      data: { key: `otp.used.${data.nonce}`, value: String(Date.now()), category: 'auth' },
    });
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      cookieStore.delete(OTP_COOKIE);
      return { ok: false, error: 'Código já utilizado. Solicite um novo.' };
    }
    throw e;
  }

  // Limpar OTP e contador
  cookieStore.delete(OTP_COOKIE);
  await prisma.setting.deleteMany({ where: { key: `otp.attempts.${pk}` } });

  // Encontrar ou criar usuário
  let user = await prisma.user.findUnique({ where: { whatsapp: fullPhone } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        whatsapp: fullPhone,
        name: `Cliente ${fullPhone.slice(-4)}`,
      },
    });
  }

  // Criar sessão
  const sessionData: Session = {
    userId: user.id,
    role: user.role,
    whatsapp: user.whatsapp || fullPhone,
    name: user.name,
  };

  await setSessionCookie(sessionData);

  return { ok: true, session: sessionData };
}

/**
 * Grava o cookie de sessão assinado (expira em SESSION_DURATION)
 */
export async function setSessionCookie(session: Session): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signValue('session', { ...session }, SESSION_DURATION), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION,
    path: '/',
  });
}

/**
 * Recupera sessão atual
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const payload = verifyValue('session', cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  const { userId, role, whatsapp, name } = payload;
  if (
    typeof userId !== 'string' ||
    typeof role !== 'string' ||
    typeof whatsapp !== 'string' ||
    typeof name !== 'string'
  ) {
    return null;
  }
  // Revogação: o perfil vem do banco, não do cookie. Usuário removido => sem sessão.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, whatsapp: true, name: true },
  });
  if (!user) return null;
  return { userId, role: user.role, whatsapp: user.whatsapp || whatsapp, name: user.name || name };
}

/**
 * Encerra sessão
 */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Exige admin (uso em API routes)
 */
export async function requireAdmin(): Promise<Session | null> {
  const session = await getSession();
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return null;
  }
  return session;
}
