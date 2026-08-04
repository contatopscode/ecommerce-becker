// ============================================================
// Evolution API - Integração WhatsApp
// ============================================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!;
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE!;

if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
  console.warn('[evolution] Variáveis de ambiente não configuradas. WhatsApp desabilitado.');
}

const BASE = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`;

interface SendTextOptions {
  number: string; // DDI + DDD + número, ex: 5581999999999
  text: string;
  delay?: number; // ms antes de enviar
  linkPreview?: boolean;
  quoted?: {
    key: { remoteJid: string; fromMe: boolean; id: string };
    message: { conversation: string };
  };
}

/**
 * Envia mensagem de texto via Evolution API
 */
export async function sendText(options: SendTextOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const body = {
      number: options.number,
      text: options.text,
      delay: options.delay || 0,
      linkPreview: options.linkPreview ?? false,
      ...(options.quoted && { quoted: options.quoted }),
    };

    const response = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('[evolution] Erro ao enviar mensagem:', error);
      return { success: false, error };
    }

    const data = await response.json();
    return { success: true, messageId: data?.key?.id };
  } catch (error) {
    console.error('[evolution] Erro:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Normaliza número para formato que Evolution API espera
 * Aceita: (81) 99999-9999, 81 99999 9999, 5581999999999
 * Retorna: 5581999999999@s.whatsapp.net
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const fullNumber = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  return `${fullNumber}@s.whatsapp.net`;
}

/**
 * Verifica status da instância
 */
export async function getInstanceState(): Promise<{ state: string; message?: string }> {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/instance/connectionState/${EVOLUTION_INSTANCE}`,
      {
        headers: { apikey: EVOLUTION_API_KEY },
      }
    );
    if (!response.ok) {
      return { state: 'error', message: `HTTP ${response.status}` };
    }
    const data = await response.json();
    return { state: data?.instance?.state || 'unknown' };
  } catch (error) {
    return { state: 'error', message: String(error) };
  }
}
