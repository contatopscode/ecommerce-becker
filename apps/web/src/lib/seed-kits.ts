// ============================================================
// Seed do catálogo de kits Becker (hoje: só o Kit Essencial do Apartamento)
// Idempotente: se o kit já existe (slug), não recria
// Cria/atualiza: name, description, price, items, image
// ============================================================
// O preço do kit é fixo (KIT_PRICE). Os kits são fixos (não tem admin pra criar/remover) — preços
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

// Produtos componentes do kit: ficam INATIVOS (não aparecem na vitrine)
interface ComponentSeed {
  slug: string;
  sku: string;
  name: string;
  label: string;
}

const COMPONENTS_CATEGORY = {
  slug: 'componentes-de-kits',
  name: 'Componentes de kits',
};

const COMPONENTS: ComponentSeed[] = [
  { slug: 'desinfetante-lavanda-2l', sku: 'KIT-COMP-DES-LAV-2L', name: 'Desinfetante Lavanda 2 L', label: '2L Lavanda' },
  { slug: 'multiuso-original-500ml', sku: 'KIT-COMP-MUL-ORI-500', name: 'Multiuso Original', label: '500ml Original' },
  { slug: 'limpa-vidros-500ml', sku: 'KIT-COMP-VID-500', name: 'Limpa Vidros', label: '500ml' },
  { slug: 'alcool-46-1l', sku: 'KIT-COMP-ALC-46-1L', name: 'Álcool 46°', label: '1L' },
  { slug: 'flower-lavanda-500ml', sku: 'KIT-COMP-FLO-LAV-500', name: 'Flower Lavanda', label: '500ml' },
];

export const KIT_PRICE = 52.5;

const KITS: KitSeed[] = [
  {
    slug: 'kit-essencial-do-apartamento',
    name: 'Kit - Essencial do Apartamento',
    shortDescription: 'Cinco produtos Becker para o apartamento',
    description:
      'Desinfetante Lavanda 2 L + Multiuso Original + Limpa Vidros + Álcool 46° + Flower Lavanda',
    category: 'casa',
    image: '/images/kits/essencial-do-apartamento.jpg',
    discountPercent: 0,
    items: COMPONENTS.map((c) => ({ productSlug: c.slug, qty: 1 })),
    isFeatured: true,
    order: 1,
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

  try {
    await ensureComponentProducts();
  } catch (e: any) {
    result.errors.push(`Componentes: ${e.message || String(e)}`);
    return result;
  }

  for (const seed of KITS) {
    try {
      // 1. Resolver todos os produtos (e versões) pelos slugs
      const resolvedItems: Array<{
        productId: string;
        productName: string;
        versionId: string | null;
        versionLabel: string | null;
        unitPrice: unknown;
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

      // 2. Preço fixo do kit; sem preço individual dos itens, "de" = "por"
      const finalPrice = KIT_PRICE;
      if (originalPrice < finalPrice) originalPrice = finalPrice;

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
    } catch (e: unknown) {
      result.errors.push(`Kit ${seed.slug}: ${(e as Error).message || String(e)}`);
    }
  }

  // Catálogo só de kits: desativa kits e produtos que não fazem parte do catálogo atual
  try {
    await prisma.kit.updateMany({
      where: { slug: { notIn: KITS.map((k) => k.slug) }, isActive: true },
      data: { isActive: false },
    });
    await prisma.product.updateMany({
      where: { active: true },
      data: { active: false },
    });
  } catch (e: any) {
    result.errors.push(`Desativação do catálogo antigo: ${e.message || String(e)}`);
  }

  return result;
}

// Cria (se faltar) os produtos componentes, inativos, com 1 versão cada
async function ensureComponentProducts() {
  const category = await prisma.category.upsert({
    where: { slug: COMPONENTS_CATEGORY.slug },
    update: {},
    create: { ...COMPONENTS_CATEGORY, active: false },
  });

  for (const c of COMPONENTS) {
    const existing = await prisma.product.findUnique({ where: { slug: c.slug } });
    if (existing) continue;
    await prisma.product.create({
      data: {
        slug: c.slug,
        sku: c.sku,
        name: c.name,
        description: c.name,
        categoryId: category.id,
        active: false,
        highlights: [],
        versions: {
          create: [{ label: c.label, price: 0, stock: 0, sku: `${c.sku}-V1` }],
        },
      },
    });
  }
}
