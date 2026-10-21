// Autorização de leitura de pedido e comparação de telefone (funções puras, sem dependências).

/** Forma canônica: só dígitos, sem DDI 55 e sem o 9 extra do celular (DDD + 8 dígitos). */
export function canonicalPhone(raw: string | null | undefined): string {
  let d = (raw ?? '').replace(/\D/g, '');
  if (d.length >= 12 && d.startsWith('55')) d = d.slice(2);
  if (d.length === 11 && d[2] === '9') d = d.slice(0, 2) + d.slice(3);
  return d;
}

export function phonesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const ca = canonicalPhone(a);
  const cb = canonicalPhone(b);
  return ca.length >= 10 && ca === cb;
}

export interface OrderOwnership {
  id: string;
  userId: string | null;
  guestWhatsapp: string | null;
  userWhatsapp: string | null;
}

export interface Viewer {
  userId: string;
  role: string;
  whatsapp: string;
}

/** Dono (sessão), ADMIN/SUPER_ADMIN, ou portador de token assinado para este pedido. */
export function canViewOrder(order: OrderOwnership, viewer: Viewer | null, tokenOrderId: string | null): boolean {
  if (tokenOrderId !== null && tokenOrderId === order.id) return true;
  if (!viewer) return false;
  if (viewer.role === 'ADMIN' || viewer.role === 'SUPER_ADMIN') return true;
  if (order.userId !== null && order.userId === viewer.userId) return true;
  if (order.userId === null && phonesMatch(order.guestWhatsapp, viewer.whatsapp)) return true;
  return false;
}

/** Formas armazenáveis do mesmo número (com/sem 55, com/sem o 9 extra), para consulta exata no banco. */
export function phoneVariants(raw: string | null | undefined): string[] {
  const c = canonicalPhone(raw);
  if (c.length !== 10) return [];
  const withNine = `${c.slice(0, 2)}9${c.slice(2)}`;
  return [c, withNine, `55${c}`, `55${withNine}`];
}
