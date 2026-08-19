// ============================================================
// Cookie helpers — becker_whatsapp_hint
// Usado pelo 1-clique: guarda o WhatsApp do cliente por 30 dias
// pra pré-preencher o checkout em visitas futuras
// ============================================================
// IMPORTANTE:
// - httpOnly: false (precisa ler no client pra decidir UI)
// - sameSite: 'lax' (permite navegação top-level)
// - Não armazena dados sensíveis (só WhatsApp + nome opcional)
// ============================================================

export const CUSTOMER_HINT_COOKIE = 'becker_whatsapp_hint';
const HINT_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias em segundos

export interface CustomerHint {
  whatsapp: string; // só dígitos, 10-11 chars
  name?: string; // opcional, pra saudação
  savedAt: number; // timestamp (debug)
}

// =================== CLIENT-SIDE (browser) ===================

/** Grava o hint no cookie. Client-side. */
export function setCustomerHintClient(hint: Omit<CustomerHint, 'savedAt'>) {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(
    JSON.stringify({ ...hint, savedAt: Date.now() })
  );
  // max-age em segundos; path=/ pra valer em todas as rotas
  document.cookie = `${CUSTOMER_HINT_COOKIE}=${value}; Max-Age=${HINT_MAX_AGE}; Path=/; SameSite=Lax`;
}

/** Lê o hint do cookie. Client-side. Retorna null se não existir. */
export function getCustomerHintClient(): CustomerHint | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const c of cookies) {
    const [k, ...v] = c.trim().split('=');
    if (k === CUSTOMER_HINT_COOKIE) {
      try {
        return JSON.parse(decodeURIComponent(v.join('='))) as CustomerHint;
      } catch {
        return null;
      }
    }
  }
  return null;
}

/** Remove o hint. Client-side. */
export function clearCustomerHintClient() {
  if (typeof document === 'undefined') return;
  document.cookie = `${CUSTOMER_HINT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

// =================== SERVER-SIDE (RSC / route) ===================

/** Lê o hint do cookie. Server-side (Next 15: cookies() é async). */
export async function getCustomerHintServer(): Promise<CustomerHint | null> {
  // Import dinâmico pra não quebrar build em client components
  const { cookies } = await import('next/headers');
  const store = await cookies();
  const raw = store.get(CUSTOMER_HINT_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(decodeURIComponent(raw)) as CustomerHint;
  } catch {
    return null;
  }
}
