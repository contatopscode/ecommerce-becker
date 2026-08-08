// ============================================================
// LGPD - Gerenciamento de consentimento de cookies
// ============================================================

export type ConsentCategory = 'essential' | 'analytics' | 'marketing';

export interface Consent {
  essential: true; // sempre true, não pode ser desativado
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

const CONSENT_KEY = 'becker_consent_v1';
const CONSENT_VERSION = '1.0';
const COOKIE_NAME = 'becker_consent';
const EXPIRY_DAYS = 365;

/**
 * Lê consentimento atual (cookie tem prioridade, localStorage é backup)
 */
export function getConsent(): Consent | null {
  if (typeof window === 'undefined') return null;

  // Tenta cookie primeiro
  const cookie = readCookie(COOKIE_NAME);
  if (cookie) {
    try {
      const parsed = JSON.parse(decodeURIComponent(cookie));
      if (parsed.version === CONSENT_VERSION) {
        return parsed;
      }
    } catch {}
  }

  // Fallback para localStorage
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.version === CONSENT_VERSION) {
        return parsed;
      }
    }
  } catch {}

  return null;
}

/**
 * Salva consentimento (cookie + localStorage)
 */
export function setConsent(consent: Omit<Consent, 'timestamp' | 'version'>): void {
  if (typeof window === 'undefined') return;

  const fullConsent: Consent = {
    essential: true,
    analytics: consent.analytics,
    marketing: consent.marketing,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };

  const value = JSON.stringify(fullConsent);

  // Salva em localStorage
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {}

  // Salva em cookie (não-httpOnly pra JS acessar, 365 dias)
  const expires = new Date();
  expires.setDate(expires.getDate() + EXPIRY_DAYS);
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * Verifica se tem consentimento para uma categoria
 */
export function hasConsent(category: ConsentCategory): boolean {
  const consent = getConsent();
  if (!consent) return false;
  if (category === 'essential') return true; // essencial sempre aceito
  return consent[category];
}

/**
 * Aceita tudo
 */
export function acceptAll(): void {
  setConsent({ analytics: true, marketing: true });
}

/**
 * Rejeita tudo (mantém só essencial)
 */
export function rejectAll(): void {
  setConsent({ analytics: false, marketing: false });
}

/**
 * Carrega scripts baseado no consentimento
 * Chamado após aceitar/atualizar consentimento
 */
export function loadScriptsForConsent(): void {
  // GA4 - Analytics
  if (hasConsent('analytics') && process.env.NEXT_PUBLIC_GA4_ID) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`);
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: any[]) {
      (window as any).dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', process.env.NEXT_PUBLIC_GA4_ID);
  }

  // Facebook Pixel - Marketing
  if (hasConsent('marketing') && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
    (window as any).fbq = (...args: any[]) => {
      ((window as any).fbq.q = (window as any).fbq.q || []).push(args);
    };
    (window as any).fbq('init', process.env.NEXT_PUBLIC_FB_PIXEL_ID);
    (window as any).fbq('track', 'PageView');
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
  }
}

function loadScript(src: string): void {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  script.async = true;
  document.head.appendChild(script);
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
