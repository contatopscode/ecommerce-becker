// ============================================================
// Seed dos 5 Kits Becker (Sprint 11)
// Idempotente: se o kit já existe (slug), não recria
// Cria/atualiza: name, description, price, items, image
// ============================================================
// Os kits são fixos (não tem admin pra criar/remover) — preços
// e produtos são ajustados aqui quando necessário.
// ============================================================

import { prisma } from '@becker/db';
// Não importamos Prisma types aqui pra não conflitar com o build do Next
// (prisma client é gerado em packages/db/node_modules/.prisma/client)

interface KitSeedItem {
  productSlug: string;
  versionLabel?: string; // se o produto tem várias versões
  qty: number;
}

interface KitSeed {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  category: 'limpeza' | 'cozinha' | 'banheiro' | 'lavanderia' | 'casa';
  image?: string;
  discountPercent: number; // 10 = 10% off
  items: KitSeedItem[];
  isFeatured?: boolean;
  order: number;
}

const KITS: KitSeed[] = [
  {
    slug: 'kit-limpeza-basica',
    name: 'Kit Limpeza Básica',
    shortDescription: 'O essencial pra começar a semana',
    description:
      'O kit perfeito pra quem quer manter a casa sempre limpa sem complicação. ' +
      'Limpador Multiuso Becker 500ml (vai em qualquer superfície) + Desinfetante Becker 2L ' +
      '(elimina 99,9% das bactérias). Inclui 2 produtos Becker com 10% de desconto no combo.',
    category: 'limpeza',
    image: '/images/kits/limpeza-basica.jpg',
    discountPercent: 10,
    items: [
      { productSlug: 'limpador-multiuso-500ml', qty: 1 },
      { productSlug: 'desinfetante-2l', qty: 1 },
    ],
    isFeatured: true,
    order: 1,
  },
  {
    slug: 'kit-cozinha-pratica',
    name: 'Kit Cozinha Prática',
    shortDescription: 'Louça brilhando e bancada limpa',
    description:
      'Tudo que você precisa pra deixar a cozinha impecável. ' +
      'Lava Louças Becker 500ml (corta gordura sem esforço) + Limpador Multiuso Becker 500ml ' +
      '(bancada, fogão, pia). Combo com 10% OFF.',
    category: 'cozinha',
    image: '/images/kits/cozinha-pratica.jpg',
    discountPercent: 10,
    items: [
      { productSlug: 'lava-loucas-500ml', qty: 1 },
      { productSlug: 'limpador-multiuso-500ml', qty: 1 },
    ],
    isFeatured: true,
    order: 2,
  },
  {
    slug: 'kit-banheiro-brilhante',
    name: 'Kit Banheiro Brilhante',
    shortDescription: 'Vidro espelho + piso cheiroso',
    description:
      'O combo completo pra um banheiro sempre pronto. ' +
      'Star Glass 4 em 1 Becker 500ml (espelhos e vidros sem mancha) + Desinfetante Becker 2L ' +
      '(piso, vaso, box). Combo com 10% OFF.',
    category: 'banheiro',
    image: '/images/kits/banheiro-brilhante.jpg',
    discountPercent: 10,
    items: [
      { productSlug: 'star-glass-4em1-500ml', qty: 1 },
      { productSlug: 'desinfetante-2l', qty: 1 },
    ],
    order: 3,
  },
  {
    slug: 'kit-lavanderia-completa',
    name: 'Kit Lavanderia Completa',
    shortDescription: 'Roupa cheirosa e macia por semanas',
    description:
      'Lava Roupas Becker Versatil 1L (rende até 40 lavagens) + Amaciante Concentrado Becker 500ml ' +
      '(perfume duradouro). Combo com 10% OFF — uma lavanderia completa em 2 produtos.',
    category: 'lavanderia',
    image: '/images/kits/lavanderia-completa.jpg',
    discountPercent: 10,
    items: [
      { productSlug: 'lava-roupas-versatil-1l', qty: 1 },
      { productSlug: 'amaciante-concentrado-500ml', qty: 1 },
    ],
    isFeatured: true,
    order: 4,
  },
  {
    slug: 'kit-casa-completa',
    name: 'Kit Casa Completa',
    shortDescription: 'Tudo que a casa precisa em um combo',
    description:
      'O kit mais completo da Becker. 5 produtos que cobrem cozinha, banheiro, lavanderia e ' +
      'limpeza geral: Lava Louças 500ml, Limpador Multiuso 500ml, Lava Roupas Versatil 1L, ' +
      'Amaciante Concentrado 500ml e Desinfetante 2L. Combo com 15% OFF — a melhor economia.',
    category: 'casa',
    image: '/images/kits/casa-completa.jpg',
    discountPercent: 15,
    items: [
      { productSlug: 'lava-loucas-500ml', qty: 1 },
      { productSlug: 'limpador-multiuso-500ml', qty: 1 },
      { productSlug: 'lava-roupas-versatil-1l', qty: 1 },
      { productSlug: 'amaciante-concentrado-500ml', qty: 1 },
      { productSlug: 'desinfetante-2l', qty: 1 },
    ],
    isFeatured: true,
    order: 5,
  },
];

export interface SeedKitsResult {
  created: string[];
  updated: string[];
  skipped: string[];
  errors: string[];
}

export async function seedKits(): Promise<SeedKitsResult> {
  const result: SeedKitsResult = { created: [], updated: [], skipped: [], errors: [] };

  for (const seed of KITS) {
    try {
      // 1. Resolver todos os produtos (e versões) pelos slugs
      const resolvedItems: Array<{
        productId: string;
        productName: string;
        versionId: string | null;
        versionLabel: string | null;
        unitPrice: any;
        weight: number | null;
        qty: number;
      }> = [];

      let originalPrice = 0; // number simples, convertido pra Decimal no final

      for (const it of seed.items) {
        const product = await prisma.product.findUnique({
          where: { slug: it.productSlug },
          include: { versions: { where: { active: true }, orderBy: { price: 'asc' } } },
        });

        if (!product || product.versions.length === 0) {
          result.errors.push(
            `Kit ${seed.slug}: produto "${it.productSlug}" não encontrado ou sem versões ativas`
          );
          continue;
        }

        // Pega a versão: se especificou label, busca; senão pega a primeira (mais barata)
        const version = it.versionLabel
          ? product.versions.find((v) => v.label === it.versionLabel) || product.versions[0]
          : product.versions[0];

        const itemPrice = Number(version.price);
        const itemTotal = itemPrice * it.qty;
        originalPrice += itemTotal;

        resolvedItems.push({
          productId: product.id,
          productName: product.name,
          versionId: version.id,
          versionLabel: version.label,
          unitPrice: itemPrice,
          weight: version.weight,
          qty: it.qty,
        });
      }

      if (resolvedItems.length === 0) {
        result.errors.push(`Kit ${seed.slug}: nenhum item resolvido, pulando`);
        continue;
      }

      // 2. Calcular preço com desconto
      const discountMultiplier = (100 - seed.discountPercent) / 100;
      const finalPrice = Math.round(originalPrice * discountMultiplier * 100) / 100;

      // 3. Upsert kit
      const existing = await prisma.kit.findUnique({ where: { slug: seed.slug } });

      if (existing) {
        // Update: mantém items (deleta e recria)
        await prisma.kitItem.deleteMany({ where: { kitId: existing.id } });
        await prisma.kit.update({
          where: { id: existing.id },
          data: {
            name: seed.name,
            shortDescription: seed.shortDescription,
            description: seed.description,
            category: seed.category,
            image: seed.image,
            price: finalPrice,
            originalPrice,
            discountPercent: seed.discountPercent,
            isFeatured: seed.isFeatured ?? false,
            isActive: true,
            order: seed.order,
            items: {
              create: resolvedItems.map((it) => ({
                productId: it.productId,
                productName: it.productName,
                versionId: it.versionId,
                versionLabel: it.versionLabel,
                qty: it.qty,
              })),
            },
          },
        });
        result.updated.push(seed.slug);
      } else {
        // Create
        await prisma.kit.create({
          data: {
            slug: seed.slug,
            name: seed.name,
            shortDescription: seed.shortDescription,
            description: seed.description,
            category: seed.category,
            image: seed.image,
            price: finalPrice,
            originalPrice,
            discountPercent: seed.discountPercent,
            isFeatured: seed.isFeatured ?? false,
            isActive: true,
            order: seed.order,
            items: {
              create: resolvedItems.map((it) => ({
                productId: it.productId,
                productName: it.productName,
                versionId: it.versionId,
                versionLabel: it.versionLabel,
                qty: it.qty,
              })),
            },
          },
        });
        result.created.push(seed.slug);
      }
    } catch (e: any) {
      result.errors.push(`Kit ${seed.slug}: ${e.message || String(e)}`);
    }
  }

  return result;
}
