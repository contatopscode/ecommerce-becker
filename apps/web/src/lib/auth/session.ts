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
function generateOTP(): string {
  const buffer = crypto.randomBytes(4);
  const num = parseInt(buffer.toString('hex'), 16) % 1_000_000;
  return String(num).padStart(OTP_LENGTH, '0');
}

function hashOTP(otp: string, whatsapp: string): string {
  return crypto.createHmac('sha256', getSecret()).update(`${otp}:${whatsapp}`).digest('hex');
}

/**
 * Solicita código OTP. Envia por WhatsApp via Evolution API.
 */
export async function requestOTP(whatsapp: string): Promise<{ ok: boolean; error?: string; code?: string }> {
  // Normalizar
  const cleaned = whatsapp.replace(/\D/g, '');
  if (cleaned.length < 10 || cleaned.length > 13) {
    return { ok: false, error: 'WhatsApp inválido' };
  }
  const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

  // Gerar código
  const code = generateOTP();
  const hash = hashOTP(code, fullPhone);

  // Salvar no cookie (temporário)
  const cookieStore = await cookies();
  cookieStore.set(OTP_COOKIE, signValue({ whatsapp: fullPhone, hash }, OTP_DURATION), {
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
 */
export async function verifyOTP(whatsapp: string, code: string): Promise<{ ok: boolean; error?: string; session?: Session }> {
  const cleaned = whatsapp.replace(/\D/g, '');
  const fullPhone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

  const cookieStore = await cookies();
  const otpCookie = cookieStore.get(OTP_COOKIE);
  if (!otpCookie) return { ok: false, error: 'Código expirado. Solicite um novo.' };

  const data = verifyValue(otpCookie.value);
  if (!data || typeof data.whatsapp !== 'string' || typeof data.hash !== 'string') {
    cookieStore.delete(OTP_COOKIE);
    return { ok: false, error: 'Código expirado ou inválido. Solicite um novo.' };
  }

  if (data.whatsapp !== fullPhone) {
    return { ok: false, error: 'WhatsApp não confere' };
  }

  const inputHash = hashOTP(code, fullPhone);
  if (inputHash !== data.hash) {
    return { ok: false, error: 'Código inválido' };
  }

  // Limpar OTP
  cookieStore.delete(OTP_COOKIE);

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
  cookieStore.set(SESSION_COOKIE, signValue({ ...session }, SESSION_DURATION), {
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
  const payload = verifyValue(cookieStore.get(SESSION_COOKIE)?.value);
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
  return { userId, role, whatsapp, name };
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
