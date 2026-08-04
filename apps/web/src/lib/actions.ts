// ============================================================
// Server Actions (Next.js 15) - chamam direto do client
// 'use server' = roda SÓ no server
// ============================================================

'use server';

import { prisma } from '@becker/db';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateOrderNumber, generateTrackingCode } from './utils';
import { calculateShipping } from './shipping';
import { sendWhatsApp, normalizeWhatsAppNumber } from './whatsapp-client';

// ============ PRODUTOS ============
export async function fetchProducts(params: {
  category?: string;
  search?: string;
  isTop?: boolean;
  isFeatured?: boolean;
  isEco?: boolean;
  isNew?: boolean;
  take?: number;
}) {
  const where: any = { active: true };
  if (params.category && params.category !== 'todos') where.category = { slug: params.category };
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { shortDescription: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.isTop) where.isTop = true;
  if (params.isFeatured) where.isFeatured = true;
  if (params.isEco) where.isEco = true;
  if (params.isNew) where.isNew = true;

  return prisma.product.findMany({
    where,
    take: params.take,
    include: {
      category: { select: { id: true, slug: true, name: true, icon: true } },
      images: { orderBy: { order: 'asc' } },
      versions: { where: { active: true }, orderBy: { price: 'asc' } },
    },
  });
}

export async function fetchProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      versions: { where: { active: true }, orderBy: { price: 'asc' } },
    },
  });
}

export async function fetchRelatedProducts(productId: string, categoryId: string) {
  return prisma.product.findMany({
    where: { active: true, id: { not: productId }, categoryId },
    take: 4,
    include: {
      category: { select: { id: true, slug: true, name: true } },
      images: { orderBy: { order: 'asc' } },
      versions: { where: { active: true }, orderBy: { price: 'asc' } },
    },
  });
}

export async function fetchCategories() {
  return prisma.category.findMany({
    where: { active: true },
    orderBy: { order: 'asc' },
  });
}

// ============ FRETE ============
export async function calcShippingAction(cep: string, orderTotal: number) {
  return calculateShipping(cep, orderTotal);
}

// ============ PEDIDO ============
const checkoutSchema = z.object({
  name: z.string().min(2),
  whatsapp: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  cep: z.string().min(8),
  street: z.string().min(1),
  number: z.string().min(1),
  complement: z.string().optional(),
  district: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  shippingMethod: z.enum(['pac', 'sedex', 'free']),
  shippingPrice: z.number().min(0),
  shippingDays: z.string(),
  paymentMethod: z.enum(['pix', 'credit_card', 'boleto']),
  items: z.array(
    z.object({
      productId: z.string(),
      versionId: z.string(),
      qty: z.number().int().min(1),
    })
  ).min(1),
  acceptMarketing: z.boolean().default(false),
});

export async function createOrderAction(input: z.infer<typeof checkoutSchema>) {
  const parsed = checkoutSchema.parse(input);

  // Buscar produtos e versões
  const productIds = parsed.items.map((i) => i.productId);
  const versionIds = parsed.items.map((i) => i.versionId);

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { versions: { where: { id: { in: versionIds } } } },
  });

  if (products.length === 0) {
    throw new Error('Nenhum produto encontrado');
  }

  // Calcular totais
  const orderItems = parsed.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error('Produto não encontrado');
    const version = product.versions.find((v) => v.id === item.versionId);
    if (!version) throw new Error('Versão não encontrada');
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
  const total = subtotal + parsed.shippingPrice;

  // Criar/atualizar usuário
  const user = await prisma.user.upsert({
    where: { whatsapp: parsed.whatsapp },
    update: { name: parsed.name, email: parsed.email || undefined },
    create: {
      whatsapp: parsed.whatsapp,
      email: parsed.email || undefined,
      name: parsed.name,
    },
  });

  // Criar endereço
  const address = await prisma.address.create({
    data: {
      userId: user.id,
      cep: parsed.cep,
      street: parsed.street,
      number: parsed.number,
      complement: parsed.complement,
      district: parsed.district,
      city: parsed.city,
      state: parsed.state,
      isDefault: true,
    },
  });

  // Criar pedido
  const tracking = generateTrackingCode();
  const order = await prisma.order.create({
    data: {
      number: generateOrderNumber(),
      userId: user.id,
      guestWhatsapp: parsed.whatsapp,
      addressId: address.id,
      subtotal,
      shipping: parsed.shippingPrice,
      discount: 0,
      total,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      source: 'WEBSITE',
      paymentMethod: parsed.paymentMethod,
      shippingMethod: parsed.shippingMethod,
      tracking,
      items: { create: orderItems },
    },
    include: { items: true },
  });

  // Notifica via WhatsApp (best-effort)
  try {
    const phone = normalizeWhatsAppNumber(parsed.whatsapp);
    const message = `🛒 *Becker* - Pedido recebido!\n\n` +
      `Número: *${order.number}*\n` +
      `Total: *R$ ${order.total.toFixed(2)}*\n` +
      `Status: Aguardando pagamento\n\n` +
      `Obrigado por comprar na Becker! 💜`;
    await sendWhatsApp({ number: phone, text: message });
  } catch (e) {
    console.error('WhatsApp notify error:', e);
  }

  revalidatePath('/admin');
  return { success: true, orderId: order.number };
}

export async function getOrderAction(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { number: orderId },
    include: { items: true, address: true, user: true },
  });
  if (!order) return null;
  return {
    id: order.id,
    number: order.number,
    date: order.createdAt.toISOString().slice(0, 10),
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    total: Number(order.total),
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping),
    discount: Number(order.discount),
    tracking: order.tracking,
    items: order.items.map((i) => ({
      name: i.productName,
      label: i.versionLabel,
      qty: i.qty,
      price: Number(i.price),
      total: Number(i.total),
    })),
  };
}

export async function getOrdersByWhatsappAction(whatsapp: string) {
  const orders = await prisma.order.findMany({
    where: {
      OR: [
        { user: { whatsapp } },
        { guestWhatsapp: whatsapp },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { items: true },
  });
  return orders.map((o) => ({
    id: o.id,
    number: o.number,
    date: o.createdAt.toISOString().slice(0, 10),
    status: o.status,
    total: Number(o.total),
    itemCount: o.items.length,
    tracking: o.tracking,
  }));
}

// ============ CUPOM ============
export async function validateCouponAction(code: string, orderTotal: number) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });
  if (!coupon || !coupon.active) return { ok: false, msg: 'Cupom não encontrado' };
  if (coupon.expiresAt && coupon.expiresAt < new Date()) return { ok: false, msg: 'Cupom expirado' };
  if (orderTotal < coupon.minOrder) {
    return { ok: false, msg: `Pedido mínimo de R$ ${coupon.minOrder.toFixed(2)}` };
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, msg: 'Cupom esgotado' };
  }
  let discount = 0;
  if (coupon.type === 'PERCENT') discount = orderTotal * (coupon.discount / 100);
  if (coupon.type === 'FIXED') discount = coupon.discount;
  return {
    ok: true,
    coupon: { code: coupon.code, type: coupon.type, discount: coupon.discount, value: discount },
    msg: `Cupom aplicado! ${coupon.type === 'PERCENT' ? `-${coupon.discount}%` : `-R$ ${coupon.discount.toFixed(2)}`}`,
  };
}
