// ============================================================
// Preferência do Checkout Pro a partir de um pedido já gravado
// Valores sempre vêm do banco (servidor), nunca do cliente
// ============================================================

import 'server-only';
import { prisma } from '@becker/db';
import { mercadopagoLib } from './index';

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

  const items = order.items.map((i) => ({
    id: i.kitId ?? i.productId,
    title: i.versionLabel ? `${i.productName} - ${i.versionLabel}` : i.productName,
    quantity: i.qty,
    unit_price: Number(i.price),
    currency_id: 'BRL',
  }));

  const discount = Number(order.discount);
  if (discount > 0) {
    items.push({ id: 'desconto', title: 'Desconto', quantity: 1, unit_price: -discount, currency_id: 'BRL' });
  }

  const result = await mercadopagoLib.createPreference({
    orderId: order.id,
    orderNumber: order.number,
    items,
    total: Number(order.total),
    shippingCost: Number(order.shipping),
    customer: { name: order.user?.name || 'Cliente', email: order.user?.email || undefined },
  });

  if (!result.ok || !result.initPoint) {
    console.error('[mercadopago] Falha ao criar preferência do pedido', order.number);
    return { error: CARD_ERROR };
  }
  return { initPoint: result.initPoint, preferenceId: result.preferenceId };
}
