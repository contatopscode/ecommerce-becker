// ============================================================
// Utilitários gerais (server + client)
// ============================================================

export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function generateOrderNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase().replace(/[^A-Z0-9]/g, '0');
  return `BKR-${yyyy}${mm}-${random}`;
}

export function generateTrackingCode(): string {
  const nums = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const chk = Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join('');
  return `BR${nums}${chk}BR`;
}

export function maskCep(cep: string): string {
  const cleaned = cep.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length > 5) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  return cleaned;
}

export function maskWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length > 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  if (cleaned.length > 2) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length > 0) return `(${cleaned}`;
  return '';
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Aguardando pagamento',
    PAID: 'Pago',
    PROCESSING: 'Em separação',
    SHIPPED: 'Enviado',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
    REFUNDED: 'Reembolsado',
  };
  return map[status] || status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'amber',
    PAID: 'blue',
    PROCESSING: 'purple',
    SHIPPED: 'sky',
    DELIVERED: 'eco',
    CANCELLED: 'red',
    REFUNDED: 'slate',
  };
  return map[status] || 'slate';
}

export function statusStepIndex(status: string): number {
  const order = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  return order.indexOf(status);
}
