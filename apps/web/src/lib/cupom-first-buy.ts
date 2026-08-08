// ============================================================
// Cupom automático de primeira compra
// Sprint 9: detecta se é primeira compra e aplica cupom automaticamente
// ============================================================

import 'server-only';
import { prisma } from '@becker/db';

export interface FirstBuyCouponResult {
  isFirstBuy: boolean;
  couponCode: string | null;
  discount: number;
  discountType: 'percent' | 'fixed';
}

/**
 * Verifica se WhatsApp é de primeira compra e retorna cupom aplicável
 * - Se for primeira compra E existir cupom configurado em "promo_first_buy_coupon"
 *   E o cupom existir E estiver ativo E válido
 * - Retorna o cupom para aplicação automática
 */
export async function getFirstBuyCoupon(whatsapp: string): Promise<FirstBuyCouponResult> {
  // Padrão: sem cupom
  const result: FirstBuyCouponResult = {
    isFirstBuy: false,
    couponCode: null,
    discount: 0,
    discountType: 'percent',
  };

  if (!whatsapp) return result;

  const cleaned = whatsapp.replace(/\D/g, '');
  if (cleaned.length < 10) return result;

  const phone = cleaned.startsWith('55') ? cleaned : `55${cleaned}`;

  // 1. Verifica se é primeira compra
  const user = await prisma.user.findFirst({
    where: { whatsapp: { in: [phone, whatsapp] } },
  });

  if (user) {
    const ordersCount = await prisma.order.count({
      where: { userId: user.id },
    });
    if (ordersCount > 0) {
      return result; // já comprou antes
    }
  }

  result.isFirstBuy = true;

  // 2. Busca cupom configurado
  const setting = await prisma.setting.findUnique({
    where: { key: 'promo_first_buy_coupon' },
  });

  if (!setting?.value) {
    // Fallback: BECKER15
    const coupon = await prisma.coupon.findUnique({
      where: { code: 'BECKER15' },
    });
    if (coupon && coupon.active) {
      result.couponCode = coupon.code;
      result.discount = Number(coupon.discount);
      result.discountType = coupon.type as any;
    }
    return result;
  }

  // 3. Verifica se cupom existe e está válido
  const coupon = await prisma.coupon.findUnique({
    where: { code: setting.value },
  });

  if (!coupon || !coupon.active) {
    return result;
  }

  // Verifica expiração
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return result;
  }

  // Verifica limite de usos
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return result;
  }

  result.couponCode = coupon.code;
  result.discount = Number(coupon.discount);
  result.discountType = coupon.type as any;

  return result;
}
