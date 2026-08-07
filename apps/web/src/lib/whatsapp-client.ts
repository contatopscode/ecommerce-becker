// ============================================================
// Cliente WhatsApp simplificado (server-side only)
// Usa a Evolution API direto via fetch
// ============================================================

import 'server-only';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || '';
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE || '';

export interface SendTextOptions {
  number: string;
  text: string;
}

export function normalizeWhatsAppNumber(phone: string): string {
  const cleaned = (phone || '').replace(/\D/g, '');
  // Garante código do país
  let full = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;
  // Se tem 13 dígitos (55 + DDD + 9 + 9 dígitos), tira o 9
  // 55 81 9 999441333 = 13 dígitos -> 55 81 999441333 = 12 dígitos
  if (full.length === 13 && full.startsWith('55')) {
    return full.slice(0, 4) + full.slice(5);
  }
  return full;
}

export async function sendWhatsApp(options: SendTextOptions): Promise<{ success: boolean; error?: string }> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
    console.warn('[whatsapp] Evolution API não configurada');
    return { success: false, error: 'Evolution API não configurada' };
  }

  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: options.number,
          text: options.text,
        }),
      }
    );
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
