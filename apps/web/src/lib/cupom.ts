// ============================================================
// Regras de cupom compartilhadas por /api/cupom/validate e /api/orders/create
// ============================================================

export interface CupomRegras {
  type: string; // percent | fixed | shipping
  discount: number;
  minOrder: number | null;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  active: boolean;
}

export type CupomVerificacao = { ok: true } | { ok: false; error: string; status: number };

/**
 * Verifica se o cupom pode ser usado para um pedido de valor `orderTotal`.
 * Função pura: não acessa banco nem relógio global (`now` é injetável).
 */
export function verificarCupom(c: CupomRegras, orderTotal: number, now: Date = new Date()): CupomVerificacao {
  if (!c.active) return { ok: false, error: 'Cupom inativo', status: 400 };
  if (c.expiresAt && c.expiresAt < now) return { ok: false, error: 'Cupom expirado', status: 400 };
  if (c.maxUses !== null && c.usedCount >= c.maxUses) return { ok: false, error: 'Cupom esgotado', status: 400 };
  if (c.minOrder && orderTotal < c.minOrder) {
    return { ok: false, error: `Pedido mínimo de R$ ${c.minOrder.toFixed(2)} pra esse cupom`, status: 400 };
  }
  return { ok: true };
}

/**
 * Calcula o desconto em R$ sobre o subtotal. Percentual limitado a 0..100,
 * desconto nunca negativo nem maior que o subtotal. Cupom `shipping` não dá desconto no subtotal.
 */
export function calcularDesconto(c: Pick<CupomRegras, 'type' | 'discount'>, subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0 || !Number.isFinite(c.discount)) return 0;
  let desconto = 0;
  if (c.type === 'percent') desconto = subtotal * (Math.min(100, Math.max(0, c.discount)) / 100);
  else if (c.type === 'fixed') desconto = Math.max(0, c.discount);
  return Math.min(desconto, subtotal);
}
