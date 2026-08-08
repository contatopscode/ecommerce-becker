// ============================================================
// Payments - Fachada
// Decide qual gateway usar baseado na configuração
// ============================================================

import 'server-only';
import { prisma } from '@becker/db';
import * as mercadopago from './mercadopago';

export type PaymentProvider = 'mercadopago' | 'simulated';

/**
 * Retorna provider ativo baseado na configuração
 */
export async function getActiveProvider(): Promise<PaymentProvider> {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ['payments_mp_access_token', 'payments_mp_sandbox'] } },
    });
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    if (map.payments_mp_access_token) {
      return 'mercadopago';
    }
  } catch {}

  // Fallback: env var
  if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
    return 'mercadopago';
  }

  return 'simulated';
}

/**
 * Verifica se Mercado Pago está configurado
 */
export async function isMercadoPagoConfigured(): Promise<boolean> {
  const provider = await getActiveProvider();
  return provider === 'mercadopago';
}

// Re-exporta as funções do MP
export const mercadopagoLib = mercadopago;
