// ============================================================
// Schemas de validação (Zod)
// ============================================================

import { z } from 'zod';

// ============ PRODUTO ============
export const productVersionSchema = z.object({
  label: z.string().min(1, 'Label obrigatório'),
  price: z.number().positive('Preço deve ser positivo'),
  originalPrice: z.number().positive().optional(),
  stock: z.number().int().min(0).default(0),
  weight: z.number().int().positive().optional(),
  sku: z.string().min(1, 'SKU obrigatório'),
});

export const productCreateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug inválido'),
  sku: z.string().min(1, 'SKU obrigatório'),
  name: z.string().min(2, 'Nome muito curto').max(200),
  description: z.string().min(10, 'Descrição muito curta'),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().min(1, 'Categoria obrigatória'),
  brand: z.string().default('Becker'),
  isEco: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isTop: z.boolean().default(false),
  isNew: z.boolean().default(false),
  highlights: z.array(z.string()).default([]),
  versions: z.array(productVersionSchema).min(1, 'Pelo menos 1 versão'),
  images: z.array(z.string().url()).min(1, 'Pelo menos 1 imagem'),
});

// ============ CHECKOUT ============
export const checkoutSchema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  whatsapp: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'WhatsApp inválido'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  cpfCnpj: z.string().optional().or(z.literal('')),
  acceptMarketing: z.boolean().default(false),

  address: z.object({
    cep: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido'),
    street: z.string().min(1, 'Rua obrigatória'),
    number: z.string().min(1, 'Número obrigatório'),
    complement: z.string().optional(),
    district: z.string().min(1, 'Bairro obrigatório'),
    city: z.string().min(1, 'Cidade obrigatória'),
    state: z.string().length(2, 'Estado inválido'),
  }),

  shipping: z.object({
    method: z.enum(['pac', 'sedex', 'free']),
    price: z.number().min(0),
    days: z.string(),
  }),

  payment: z.object({
    method: z.enum(['pix', 'credit_card', 'boleto']),
  }),

  items: z.array(
    z.object({
      productId: z.string(),
      versionId: z.string(),
      qty: z.number().int().min(1).max(99),
    })
  ).min(1, 'Carrinho vazio'),

  coupon: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// ============ AUTH ============
export const loginSchema = z.object({
  whatsapp: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'WhatsApp inválido'),
});

export const verifyOtpSchema = z.object({
  whatsapp: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/),
  code: z.string().length(6, 'Código deve ter 6 dígitos'),
});

// ============ ADMIN ============
export const updateOrderStatusSchema = z.object({
  orderId: z.string(),
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  tracking: z.string().optional(),
  notes: z.string().optional(),
});
