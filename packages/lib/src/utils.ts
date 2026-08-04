// ============================================================
// Utilitários gerais
// ============================================================

import { nanoid } from 'nanoid';

/**
 * Formata um número como preço em Real Brasileiro
 */
export function formatPrice(price: number | string): string {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Gera número de pedido no formato BKR-YYYYMM-XXXXXX
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const random = nanoid(6).toUpperCase().replace(/[^A-Z0-9]/g, '0');
  return `BKR-${yyyy}${mm}-${random}`;
}

/**
 * Gera código de rastreio fake (em produção virá do Melhor Envio/Correios)
 */
export function generateTrackingCode(): string {
  const numbers = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const check = Array.from({ length: 2 }, () => Math.floor(Math.random() * 10)).join('');
  return `BR${numbers}${check}BR`;
}

/**
 * Aplica máscara de CEP
 */
export function maskCep(cep: string): string {
  const cleaned = cep.replace(/\D/g, '').slice(0, 8);
  if (cleaned.length > 5) return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  return cleaned;
}

/**
 * Aplica máscara de WhatsApp
 */
export function maskWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length > 6) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  if (cleaned.length > 2) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length > 0) return `(${cleaned}`;
  return '';
}

/**
 * Aplica máscara de CPF/CNPJ
 */
export function maskCpfCnpj(value: string): string {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 11) {
    // CPF
    return cleaned
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // CNPJ
    return cleaned
      .slice(0, 14)
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
}

/**
 * Calcula parcelas com juros
 */
export function calculateInstallments(
  total: number,
  maxInstallments: number = 3,
  interestFree: number = 3
): Array<{ count: number; value: number; total: number; hasInterest: boolean }> {
  const result = [];
  for (let i = 1; i <= maxInstallments; i++) {
    const hasInterest = i > interestFree;
    const rate = hasInterest ? 0.0299 : 0; // 2,99% a.m. se passar do limite
    const value = (total * Math.pow(1 + rate, i)) / i;
    result.push({
      count: i,
      value: Math.round(value * 100) / 100,
      total: Math.round(value * i * 100) / 100,
      hasInterest,
    });
  }
  return result;
}
