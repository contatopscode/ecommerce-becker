// ============================================================
// Checkout Flow — lógica do 1-clique
// Decide step inicial e o que pré-preencher com base em:
//   - cookie becker_whatsapp_hint (cliente conhecido)
//   - ?fast=1 (veio de "Comprar agora" no produto)
// ============================================================
// Steps:
//   1 = Identificação (WhatsApp + nome + email)
//   2 = Endereço
//   3 = Entrega (frete)
//   4 = Pagamento
// ============================================================

import type { CustomerHint } from './cookie-helpers';

export type CheckoutStep = 1 | 2 | 3 | 4;

export interface CustomerLike {
  id: string;
  name: string;
  whatsapp: string;
  email?: string | null;
  address?: {
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
  } | null;
  orderCount?: number;
  isFirstPurchase?: boolean;
  isNewLead?: boolean;
  suggestedName?: string;
}

export interface CheckoutStartDecision {
  initialStep: CheckoutStep;
  /** Cliente pré-buscado no backend (se hint bateu). null se não tem hint. */
  customer: CustomerLike | null;
  /** Se true, mostra o toast "1-clique ativado" */
  isFastPath: boolean;
  /** Texto do toast inicial pro usuário */
  toastMessage: string | null;
}

/** Decide como iniciar o checkout. */
export function decideCheckoutStart(opts: {
  hint: CustomerHint | null;
  fastParam: boolean;
}): CheckoutStartDecision {
  const { hint, fastParam } = opts;

  // Caso 1: sem hint → fluxo normal, step 1
  if (!hint) {
    return {
      initialStep: 1,
      customer: null,
      isFastPath: false,
      toastMessage: null,
    };
  }

  // Caso 2: tem hint mas NÃO é fast-path (cliente abriu checkout manualmente)
  // → step 1 pra confirmar dados, mas pré-preencher o WhatsApp
  if (!fastParam) {
    return {
      initialStep: 1,
      customer: null, // null aqui = a página vai buscar /by-whatsapp com o número do hint
      isFastPath: false,
      toastMessage: `👋 Oi${hint.name ? `, ${hint.name.split(' ')[0]}` : ''}! Seus dados vão aparecer rapidinho.`,
    };
  }

  // Caso 3: fast-path SEM endereço conhecido ainda
  // → step 2 (vai pedir CEP)
  // A busca /by-whatsapp vai popular customer.address automaticamente
  return {
    initialStep: 2,
    customer: null, // ainda null; a página busca com hint.whatsapp
    isFastPath: true,
    toastMessage: `⚡ 1-clique ativado! Confirme seu endereço pra continuar.`,
  };
}

/** Helper pra formatar WhatsApp no padrão (XX) XXXXX-XXXX */
export function digitsToWhatsapp(digits: string): string {
  const v = digits.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 2) return v;
  if (v.length <= 7) return `(${v.slice(0, 2)}) ${v.slice(2)}`;
  if (v.length <= 10) return `(${v.slice(0, 2)}) ${v.slice(2, 6)}-${v.slice(6)}`;
  return `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
}
