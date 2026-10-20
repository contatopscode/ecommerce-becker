// ============================================================
// Seed do banco com produtos Becker
// Execute: pnpm db:seed
// ============================================================

import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();

const COMPONENT_CATEGORY = 'componentes-de-kits';

const CATEGORIES = [
  { slug: 'lava-roupas', name: 'Lava Roupas', icon: '🧺', color: 'purple', order: 1 },
  { slug: 'multiuso', name: 'Multiuso', icon: '🧴', color: 'orange', order: 2 },
  { slug: 'amaciantes', name: 'Amaciantes', icon: '💧', color: 'blue', order: 3 },
  { slug: 'desinfetantes', name: 'Desinfetantes', icon: '🛡️', color: 'eco', order: 4 },
  { slug: 'limpa-moveis', name: 'Limpa Móveis', icon: '🪑', color: 'amber', order: 5 },
  { slug: 'cozinha', name: 'Cozinha', icon: '🍽️', color: 'rose', order: 6 },
  { slug: 'alcool', name: 'Álcool & Sanitizantes', icon: '🧪', color: 'sky', order: 7 },
  { slug: 'pro', name: 'Becker PRO', icon: '⚡', color: 'purple', order: 8 },
  { slug: 'eco', name: 'Linha Eco', icon: '🌿', color: 'eco', order: 9 },
  { slug: COMPONENT_CATEGORY, name: 'Componentes de kits', icon: '📦', color: 'purple', order: 99, active: false },
];

interface SeedProduct {
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  category: string;
  isEco?: boolean;
  isFeatured?: boolean;
  isTop?: boolean;
  isNew?: boolean;
  highlights: string[];
  images: string[];
  versions: Array<{ label: string; price: number; originalPrice?: number; stock: number; weight: number; sku: string }>;
}

// Catálogo só de kits: os produtos abaixo são apenas componentes do kit
// "Kit - Essencial do Apartamento" e ficam INATIVOS (não aparecem na vitrine).
const PRODUCTS: SeedProduct[] = [
  { slug: 'desinfetante-lavanda-2l', sku: 'KIT-COMP-DES-LAV-2L', name: 'Desinfetante Lavanda 2 L', label: '2L Lavanda' },
  { slug: 'multiuso-original-500ml', sku: 'KIT-COMP-MUL-ORI-500', name: 'Multiuso Original', label: '500ml Original' },
  { slug: 'limpa-vidros-500ml', sku: 'KIT-COMP-VID-500', name: 'Limpa Vidros', label: '500ml' },
  { slug: 'alcool-46-1l', sku: 'KIT-COMP-ALC-46-1L', name: 'Álcool 46°', label: '1L' },
  { slug: 'flower-lavanda-500ml', sku: 'KIT-COMP-FLO-LAV-500', name: 'Flower Lavanda', label: '500ml' },
].map((c) => ({
  slug: c.slug,
  sku: c.sku,
  name: c.name,
  shortDescription: c.name,
  description: c.name,
  category: COMPONENT_CATEGORY,
  highlights: [],
  images: [],
  versions: [{ label: c.label, price: 0, stock: 0, weight: 0, sku: `${c.sku}-V1` }],
}));

async function main() {
  console.log('🌱 Seeding Becker database...\n');

  // Limpar dados existentes (em dev)
  console.log('🗑️  Limpando dados antigos...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.address.deleteMany();
  await prisma.review.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVersion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.newsletter.deleteMany();
  await prisma.whatsAppConversation.deleteMany();

  // Criar categorias
  console.log('📁 Criando categorias...');
  const categoryMap = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({ data: cat });
    categoryMap.set(cat.slug, created.id);
    console.log(`  ✓ ${cat.name}`);
  }

  // Criar produtos
  console.log('\n📦 Criando produtos...');
  for (const p of PRODUCTS) {
    const categoryId = categoryMap.get(p.category);
    if (!categoryId) {
      console.warn(`  ⚠ Categoria não encontrada: ${p.category}`);
      continue;
    }

    const product = await prisma.product.create({
      data: {
        slug: p.slug,
        sku: p.sku,
        name: p.name,
        shortDescription: p.shortDescription,
        description: p.description,
        categoryId,
        active: false,
        isEco: p.isEco ?? false,
        isFeatured: p.isFeatured ?? false,
        isTop: p.isTop ?? false,
        isNew: p.isNew ?? false,
        highlights: p.highlights,
        images: {
          create: p.images.map((url, i) => ({
            url,
            order: i,
            isPrimary: i === 0,
          })),
        },
        versions: {
          create: p.versions.map((v) => ({
            label: v.label,
            price: v.price,
            originalPrice: v.originalPrice,
            stock: v.stock,
            weight: v.weight,
            sku: v.sku,
          })),
        },
      },
    });
    console.log(`  ✓ ${product.name} (${p.versions.length} versões)`);
  }

  // Cupons de exemplo
  console.log('\n🎟️  Criando cupons...');
  await prisma.coupon.createMany({
    data: [
      { code: 'BECKER10', type: 'PERCENT', discount: 10, minOrder: 0 },
      { code: 'PRIMEIRACOMPRA', type: 'PERCENT', discount: 15, minOrder: 50 },
      { code: 'FRETE0', type: 'FREE_SHIPPING', discount: 0, minOrder: 199 },
    ],
  });
  console.log('  ✓ 3 cupons criados');

  // Admin user
  console.log('\n👤 Criando admin...');
  await prisma.user.create({
    data: {
      name: 'Admin Becker',
      whatsapp: '(81) 99902-2262',
      email: 'admin@becker.com.br',
      role: 'SUPER_ADMIN',
    },
  });
  console.log('  ✓ Admin criado (whatsapp: 81999022262)');

  console.log('\n✨ Seed concluído com sucesso!');
  console.log(`   ${CATEGORIES.length} categorias`);
  console.log(`   ${PRODUCTS.length} produtos`);
  console.log(`   ~${PRODUCTS.reduce((sum, p) => sum + p.versions.length, 0)} versões`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
