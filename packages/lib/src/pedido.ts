// ============================================================
// Lógica de negócio - Pedidos
// ============================================================

import { prisma } from '@becker/db';
import { generateOrderNumber, generateTrackingCode } from './utils';

interface CreateOrderInput {
  userId?: string;
  guestEmail?: string;
  guestWhatsapp: string;
  address: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    state: string;
  };
  items: Array<{
    productId: string;
    versionId: string;
    qty: number;
  }>;
  shipping: {
    method: 'pac' | 'sedex' | 'free';
    price: number;
    days: string;
  };
  payment: {
    method: 'pix' | 'credit_card' | 'boleto';
  };
  coupon?: string;
  source?: 'WEBSITE' | 'WHATSAPP' | 'ADMIN';
}

/**
 * Cria um pedido completo no banco
 */
export async function createOrder(input: CreateOrderInput) {
  // 1. Buscar produtos e versões
  const productIds = input.items.map((i) => i.productId);
  const versionIds = input.items.map((i) => i.versionId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { versions: { where: { id: { in: versionIds } } } },
  });

  if (products.length === 0) {
    throw new Error('Nenhum produto encontrado');
  }

  // 2. Validar estoque e calcular totais
  const orderItems = input.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Produto ${item.productId} não encontrado`);
    const version = product.versions.find((v) => v.id === item.versionId);
    if (!version) throw new Error(`Versão ${item.versionId} não encontrada`);
    if (version.stock < item.qty) {
      throw new Error(`Estoque insuficiente para ${product.name} ${version.label}`);
    }

    const price = Number(version.price);
    return {
      productId: product.id,
      productName: product.name,
      versionId: version.id,
      versionLabel: version.label,
      sku: version.sku,
      price,
      qty: item.qty,
      total: price * item.qty,
    };
  });

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const discount = 0; // TODO: implementar cupons
  const total = subtotal - discount + input.shipping.price;

  // 3. Criar ou atualizar usuário
  let userId = input.userId;
  if (!userId) {
    const user = await prisma.user.upsert({
      where: { whatsapp: input.guestWhatsapp },
      update: {},
      create: {
        whatsapp: input.guestWhatsapp,
        email: input.guestEmail,
        name: '', // será atualizado depois
      },
    });
    userId = user.id;
  }

  // 4. Criar endereço
  const address = await prisma.address.create({
    data: {
      userId,
      cep: input.address.cep,
      street: input.address.street,
      number: input.address.number,
      complement: input.address.complement,
      district: input.address.district,
      city: input.address.city,
      state: input.address.state,
      isDefault: true,
    },
  });

  // 5. Criar pedido
  const number = generateOrderNumber();
  const order = await prisma.order.create({
    data: {
      number,
      userId,
      guestWhatsapp: input.guestWhatsapp,
      addressId: address.id,
      subtotal,
      shipping: input.shipping.price,
      discount,
      total,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      source: input.source || 'WEBSITE',
      paymentMethod: input.payment.method,
      shippingMethod: input.shipping.method,
      items: {
        create: orderItems,
      },
    },
    include: {
      items: true,
      address: true,
      user: true,
    },
  });

  return order;
}

/**
 * Atualiza status do pedido
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED',
  options?: { tracking?: string; paymentId?: string }
) {
  const updateData: any = { status };

  if (status === 'PAID') {
    updateData.paymentStatus = 'PAID';
    updateData.paidAt = new Date();
  }
  if (status === 'SHIPPED') {
    updateData.shippedAt = new Date();
    updateData.tracking = options?.tracking || generateTrackingCode();
  }
  if (status === 'DELIVERED') {
    updateData.deliveredAt = new Date();
  }
  if (status === 'CANCELLED') {
    updateData.cancelledAt = new Date();
  }
  if (options?.paymentId) {
    updateData.paymentId = options.paymentId;
  }

  return prisma.order.update({
    where: { id: orderId },
    data: updateData,
  });
}

/**
 * Busca pedido por número
 */
export async function getOrderByNumber(number: string) {
  return prisma.order.findUnique({
    where: { number },
    include: {
      items: true,
      address: true,
      user: true,
    },
  });
}

/**
 * Busca pedidos por WhatsApp (para o agente consultar)
 */
export async function getOrdersByWhatsapp(whatsapp: string) {
  return prisma.order.findMany({
    where: {
      OR: [
        { user: { whatsapp } },
        { guestWhatsapp: whatsapp },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { items: true },
  });
}
