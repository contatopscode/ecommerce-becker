// ============================================================
// Preferência do Checkout Pro a partir de um pedido já gravado
// Valores sempre vêm do banco (servidor), nunca do cliente
// ============================================================

import 'server-only';
import { prisma } from '@becker/db';
import { mercadopagoLib } from './index';
import { buildPreferenceItems, isMercadoPagoUrl } from './preference-items';

export interface OrderCardPayment {
  initPoint?: string;
  preferenceId?: string;
  error?: string;
}

const CARD_ERROR = 'Não foi possível iniciar o pagamento com cartão agora. Seu pedido foi registrado; tente de novo em instantes.';

export async function createCardPaymentForOrder(orderId: string): Promise<OrderCardPayment> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, user: true },
  });
  if (!order) return { error: 'Pedido não encontrado' };

  const built = buildPreferenceItems({
    number: order.number,
    total: Number(order.total),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    items: order.items.map((i) => ({
      id: i.kitId ?? i.productId,
      productName: i.productName,
      versionLabel: i.versionLabel,
      qty: i.qty,
      price: Number(i.price),
    })),
  });
  if (!built.ok) {
    console.error('[mercadopago] Valores inconsistentes no pedido', order.number);
    return { error: CARD_ERROR };
  }

  const result = await mercadopagoLib.createPreference({
    orderId: order.id,
    orderNumber: order.number,
    items: built.items,
    total: Number(order.total),
    shippingCost: built.shippingCost,
    customer: { name: order.user?.name || 'Cliente', email: order.user?.email || undefined },
  });

  if (!result.ok || !isMercadoPagoUrl(result.initPoint)) {
    console.error('[mercadopago] Falha ao criar preferência do pedido', order.number);
    return { error: CARD_ERROR };
  }
  return { initPoint: result.initPoint, preferenceId: result.preferenceId };
}
