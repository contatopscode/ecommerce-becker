// ============================================================
// Seed do banco com produtos Becker
// Execute: pnpm db:seed
// ============================================================

import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();

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

const PRODUCTS: SeedProduct[] = [
  // ============ LAVA ROUPAS ============
  {
    slug: 'eco-becker-lava-roupas-3l', sku: 'BKR-LR-ECO-3L',
    name: 'Eco Becker Lava Roupas',
    category: 'lava-roupas',
    shortDescription: 'Lava roupas com sabão vegetal e energia solar. Rende até 30 lavagens.',
    description: 'O Eco Becker é o lava roupas que cuida das suas roupas e do planeta. Produzido com tensoativos derivados de óleo de palma, milho e babaçu, e fabricado 100% com energia solar e eólica.',
    isEco: true, isFeatured: true, isTop: true, isNew: true,
    highlights: ['Sabão vegetal', 'Energia renovável', '30 lavagens', 'Biodegradável'],
    images: ['/img/products/eco-becker-3l.jpeg'],
    versions: [{ label: '3L', price: 39.90, stock: 142, weight: 3200, sku: 'BKR-LR-ECO-3L' }],
  },
  {
    slug: 'lava-roupas-multipla-acao-3l', sku: 'BKR-LR-MULTI-3L',
    name: 'Lava Roupas Múltipla Ação',
    category: 'lava-roupas',
    shortDescription: 'Poderoso detergente líquido concentrado e perfumado.',
    description: 'Detergente concentrado com alto poder de limpeza, mantém as cores vibrantes, agente anti-redepositante e tensoativos biodegradáveis.',
    isFeatured: true, isTop: true,
    highlights: ['Concentrado', 'Tensoativos biodegradáveis', 'Anti-redepositante', '30 lavagens'],
    images: ['/img/products/lava-roupas-multipla-acao-3l.jpeg'],
    versions: [
      { label: '3L', price: 28.90, originalPrice: 32.00, stock: 89, weight: 3200, sku: 'BKR-LR-MULTI-3L' },
      { label: '5L', price: 44.90, originalPrice: 49.90, stock: 45, weight: 5300, sku: 'BKR-LR-MULTI-5L' },
    ],
  },
  {
    slug: 'lava-roupas-versatil-1l', sku: 'BKR-LR-VERS-1L',
    name: 'Lava Roupas Versatil',
    category: 'lava-roupas',
    shortDescription: 'Penetra entre as fibras, remove todo tipo de sujeira.',
    description: 'Lava roupas com formulação versátil para roupas brancas e coloridas.',
    highlights: ['20 a 50ml por ciclo', 'Rende até 10 lavagens', 'Todas as cores'],
    images: ['/img/products/lava-roupas-versatil-1l.jpeg'],
    versions: [
      { label: 'Pouch 700ml', price: 14.50, stock: 76, weight: 800, sku: 'BKR-LR-VERS-700' },
      { label: '1L', price: 19.90, originalPrice: 22.00, stock: 124, weight: 1100, sku: 'BKR-LR-VERS-1L' },
      { label: '3L', price: 39.90, stock: 67, weight: 3200, sku: 'BKR-LR-VERS-3L' },
    ],
  },
  {
    slug: 'lava-roupas-coco-3l', sku: 'BKR-LR-COCO-3L',
    name: 'Lava Roupas Coco',
    category: 'lava-roupas',
    shortDescription: 'Limpeza rápida com agradável perfume de coco.',
    description: 'Lava roupas com fragrância clássica de coco, ideal para roupas brancas e de cores firmes.',
    highlights: ['100ml por ciclo', 'Rende até 30 lavagens', 'Sem agredir tecidos'],
    images: ['/img/products/lava-roupas-coco-3l.jpeg'],
    versions: [{ label: '3L', price: 24.90, stock: 54, weight: 3200, sku: 'BKR-LR-COCO-3L' }],
  },
  {
    slug: 'lava-roupas-em-po-5kg', sku: 'BKR-LR-PO-5KG',
    name: 'Lava Roupas em Pó',
    category: 'lava-roupas',
    shortDescription: 'Enzimas ativas para roupas brancas e coloridas.',
    description: 'Lava roupas em pó com enzimas ativas que removem manchas e eliminam odores.',
    isNew: true,
    highlights: ['Enzimas ativas', '50 lavagens', 'Anti-redepositante', '5kg'],
    images: ['/img/products/lava-roupas-em-po-5kg.jpeg'],
    versions: [{ label: 'Saco 5kg', price: 49.90, stock: 38, weight: 5100, sku: 'BKR-LR-PO-5KG' }],
  },

  // ============ MULTIUSO ============
  {
    slug: 'limpador-multiuso-500ml', sku: 'BKR-MUL-500',
    name: 'Limpador Multiuso',
    category: 'multiuso',
    shortDescription: 'Remove gorduras, fuligem, poeira e marcas de dedos.',
    description: 'Limpador multiuso eficiente na limpeza de vidros, espelhos, azulejos, fórmica, plásticos e superfícies laváveis. Disponível em 5 fragrâncias.',
    isFeatured: true, isTop: true,
    highlights: ['5 fragrâncias', 'Sem agredir superfícies', '500ml', 'Rende muito'],
    images: ['/img/products/limpador-multiuso-500ml.jpeg'],
    versions: [
      { label: '500ml Original', price: 12.90, originalPrice: 15.18, stock: 245, weight: 550, sku: 'BKR-MUL-500-ORIG' },
      { label: '500ml Lavanda', price: 12.90, originalPrice: 15.18, stock: 198, weight: 550, sku: 'BKR-MUL-500-LAV' },
      { label: '500ml Floral', price: 12.90, originalPrice: 15.18, stock: 167, weight: 550, sku: 'BKR-MUL-500-FLO' },
      { label: '500ml Cozinha', price: 13.90, stock: 89, weight: 550, sku: 'BKR-MUL-500-COZ' },
      { label: '500ml Vidros', price: 13.90, stock: 134, weight: 550, sku: 'BKR-MUL-500-VID' },
    ],
  },
  {
    slug: 'star-glass-4em1-500ml', sku: 'BKR-SG-500',
    name: 'Star Glass 4 em 1',
    category: 'multiuso',
    shortDescription: 'Limpador multiuso desengordurante para limpeza profunda.',
    description: 'Limpador multiuso desengordurante para limpeza profunda de vidros, alumínio, aço escovado, louças, metais sanitários, pisos, fogões, geladeiras e coifas.',
    isNew: true,
    highlights: ['4 em 1', 'Desengordurante', 'Pulverizador', '500ml'],
    images: ['/img/products/star-glass-4em1-500ml.jpeg'],
    versions: [{ label: '500ml com pulverizador', price: 18.90, originalPrice: 22.00, stock: 87, weight: 600, sku: 'BKR-SG-500' }],
  },

  // ============ AMACIANTES ============
  {
    slug: 'amaciante-concentrado-500ml', sku: 'BKR-AMC-500',
    name: 'Amaciante Concentrado',
    category: 'amaciantes',
    shortDescription: 'Oferece maciez extrema, perfume intenso e duradouro.',
    description: 'Amaciante concentrado com fragrância livre encapsulada para perfumação intensa e duradoura.',
    isTop: true,
    highlights: ['20ml por ciclo', 'Concentrado', 'Fragrância intensa', '500ml'],
    images: ['/img/products/amaciante-concentrado-500ml.jpeg'],
    versions: [
      { label: '500ml Flores do Jardim', price: 14.50, stock: 178, weight: 600, sku: 'BKR-AMC-500-FLJ' },
      { label: '500ml Florescer', price: 14.50, stock: 145, weight: 600, sku: 'BKR-AMC-500-FLR' },
      { label: '1L Flores do Jardim', price: 22.90, stock: 89, weight: 1100, sku: 'BKR-AMC-1L' },
    ],
  },
  {
    slug: 'amaciante-tradicional-2l', sku: 'BKR-AMT-2L',
    name: 'Amaciante Tradicional',
    category: 'amaciantes',
    shortDescription: 'Proporciona maciez extrema, perfume agradável e duradouro.',
    description: 'Amaciante tradicional com fragrância clássica e duradoura.',
    highlights: ['80ml por ciclo', 'Rende 25 ciclos', '2L'],
    images: ['/img/products/amaciante-tradicional-2l.jpeg'],
    versions: [
      { label: '2L Clássico', price: 18.90, stock: 134, weight: 2200, sku: 'BKR-AMT-2L-CLA' },
      { label: '2L Carinho', price: 18.90, stock: 98, weight: 2200, sku: 'BKR-AMT-2L-CAR' },
    ],
  },
  {
    slug: 'amaciante-soft-classico-5l', sku: 'BKR-AMS-5L',
    name: 'Amaciante Soft Clássico',
    category: 'amaciantes',
    shortDescription: 'Tensoativos catiônicos que aumentam a maciez.',
    description: 'Amaciante soft com tensoativos catiônicos que proporcionam maciez e perfume agradável.',
    highlights: ['80ml por ciclo', 'Rende até 62 ciclos', '5L'],
    images: ['/img/products/amaciante-soft-classico-5l.jpeg'],
    versions: [{ label: '5L', price: 32.90, stock: 67, weight: 5300, sku: 'BKR-AMS-5L' }],
  },

  // ============ DESINFETANTES ============
  {
    slug: 'desinfetante-2l', sku: 'BKR-DES-2L',
    name: 'Desinfetante',
    category: 'desinfetantes',
    shortDescription: 'Limpa, desinfeta e deixa o ambiente perfumado por horas.',
    description: 'Desinfetante com ação bactericida comprovada.',
    isTop: true,
    highlights: ['Bactericida', '5 fragrâncias', '2L', 'Rende muito'],
    images: ['/img/products/desinfetante-2l.jpeg'],
    versions: [
      { label: '2L Floral', price: 16.90, stock: 156, weight: 2200, sku: 'BKR-DES-2L-FLO' },
      { label: '2L Lavanda', price: 16.90, stock: 134, weight: 2200, sku: 'BKR-DES-2L-LAV' },
      { label: '2L Talco', price: 16.90, stock: 87, weight: 2200, sku: 'BKR-DES-2L-TAL' },
      { label: '2L Eucalipto', price: 16.90, stock: 98, weight: 2200, sku: 'BKR-DES-2L-EUC' },
      { label: '2L Capim Limão', price: 16.90, stock: 65, weight: 2200, sku: 'BKR-DES-2L-CAP' },
    ],
  },

  // ============ LIMPA MÓVEIS ============
  {
    slug: 'versatil-lustra-moveis-200ml', sku: 'BKR-LM-VERS-200',
    name: 'Versatil Lustra Móveis',
    category: 'limpa-moveis',
    shortDescription: 'Limpa, protege, promove brilho e perfume.',
    description: 'Lustra móveis com fragrância diferenciada. Limpa, protege e dá brilho.',
    highlights: ['Limpa', 'Protege', 'Brilho', 'Perfume'],
    images: ['/img/products/lustra-moveis-versatil-200ml.jpeg'],
    versions: [{ label: '200ml', price: 9.50, stock: 198, weight: 250, sku: 'BKR-LM-VERS-200' }],
  },
  {
    slug: 'oleo-jatoba-tradicional-200ml', sku: 'BKR-LM-JAT-200',
    name: 'Óleo Jatobá Tradicional',
    category: 'limpa-moveis',
    shortDescription: 'Sofisticado aroma por muito mais tempo.',
    description: 'Óleo de jatobá especialmente elaborado com perfume diferenciado.',
    highlights: ['Aroma jatobá', 'Longa duração', '200ml'],
    images: ['/img/products/oleo-jatoba-tradicional-200ml.jpeg'],
    versions: [{ label: '200ml', price: 11.90, stock: 87, weight: 250, sku: 'BKR-LM-JAT-200' }],
  },

  // ============ COZINHA ============
  {
    slug: 'lava-loucas-500ml', sku: 'BKR-LL-500',
    name: 'Lava Louças',
    category: 'cozinha',
    shortDescription: 'Detergente para lavar louças.',
    description: 'Lava louças indicado para remoção de gorduras e sujezas em geral.',
    isTop: true,
    highlights: ['4 versões', 'Rende muito', '500ml', '2L'],
    images: ['/img/products/lava-loucas-500ml.jpeg'],
    versions: [
      { label: '500ml Neutro', price: 7.90, originalPrice: 9.90, stock: 287, weight: 550, sku: 'BKR-LL-500-NEU' },
      { label: '500ml Maçã', price: 7.90, stock: 245, weight: 550, sku: 'BKR-LL-500-MAC' },
      { label: '500ml Limão', price: 7.90, stock: 198, weight: 550, sku: 'BKR-LL-500-LIM' },
      { label: '500ml Coco', price: 7.90, stock: 167, weight: 550, sku: 'BKR-LL-500-COC' },
      { label: '2L Neutro', price: 18.90, stock: 89, weight: 2200, sku: 'BKR-LL-2L-NEU' },
    ],
  },
  {
    slug: 'cera-fantastic-750ml', sku: 'BKR-CF-750',
    name: 'Cera Fantastic',
    category: 'cozinha',
    shortDescription: 'Impermeabilizante com emulsão de cera de carnaúba.',
    description: 'Cera impermeabilizante que protege e dá brilho aos pisos.',
    highlights: ['Cera de carnaúba', 'Impermeabiliza', '750ml', 'Brilho intenso'],
    images: ['/img/products/cera-fantastic-750ml.jpeg'],
    versions: [{ label: '750ml', price: 22.90, stock: 54, weight: 850, sku: 'BKR-CF-750' }],
  },
  {
    slug: 'passa-facil-500ml', sku: 'BKR-PF-500',
    name: 'Passa-Fácil',
    category: 'cozinha',
    shortDescription: 'Facilitador para passar roupas.',
    description: 'Facilita o ato de passar, protege contra rugas, aumenta a maciez e deixa as roupas perfumadas.',
    highlights: ['Facilita passar', 'Anti-rugas', '500ml', 'Perfume duradouro'],
    images: ['/img/products/passa-facil-500ml.jpeg'],
    versions: [
      { label: '500ml', price: 13.90, stock: 76, weight: 600, sku: 'BKR-PF-500' },
      { label: '5L', price: 49.90, stock: 23, weight: 5300, sku: 'BKR-PF-5L' },
    ],
  },
  {
    slug: 'becker-flower-capim-limao-500ml', sku: 'BKR-BF-500',
    name: 'Becker Flower Capim Limão',
    category: 'cozinha',
    shortDescription: 'Aromatizador de ambientes com fragrância que estimula os sentidos.',
    description: 'Perfeito para perfumar ambientes, com uma fragrância que estimula os sentidos.',
    highlights: ['Aromatizador', 'Capim Limão', '500ml', 'Bem-estar'],
    images: ['/img/products/becker-flower-capim-limao-500ml.jpeg'],
    versions: [{ label: '500ml', price: 16.90, stock: 67, weight: 600, sku: 'BKR-BF-500' }],
  },

  // ============ ÁLCOOL ============
  {
    slug: 'alcool-etilico-70-1l', sku: 'BKR-AL-70-1L',
    name: 'Álcool Etílico 70°',
    category: 'alcool',
    shortDescription: 'Álcool 70° para desinfecção de superfícies.',
    description: 'Álcool etílico 70° INPM especialmente formulado para desinfecção.',
    isNew: true, isTop: true,
    highlights: ['70% INPM', 'Elimina 99,9% bactérias', 'Com pulverizador', '1L'],
    images: ['/img/products/alcool-etilico-1l.jpeg'],
    versions: [
      { label: '1L com pulverizador', price: 18.90, stock: 234, weight: 1100, sku: 'BKR-AL-70-1L' },
      { label: '5L galão', price: 64.90, stock: 45, weight: 5300, sku: 'BKR-AL-70-5L' },
    ],
  },
  {
    slug: 'alcool-em-gel-450g', sku: 'BKR-ALG-450',
    name: 'Álcool em Gel',
    category: 'alcool',
    shortDescription: 'Álcool em gel 70% para mãos.',
    description: 'Álcool em gel 70% INPM. Não ressseca.',
    highlights: ['70% INPM', 'Não ressseca', '450g', 'Higienização'],
    images: ['/img/products/alcool-gel-450g.jpeg'],
    versions: [{ label: '450g', price: 14.90, stock: 198, weight: 500, sku: 'BKR-ALG-450' }],
  },
  {
    slug: 'gel-fresh-500ml', sku: 'BKR-GF-500',
    name: 'Gel Fresh',
    category: 'alcool',
    shortDescription: 'Álcool em gel 70% para mãos. Reduz 99,99% das bactérias.',
    description: 'Álcool em gel 70% neutro, é indicado como complemento à higienização das mãos.',
    highlights: ['70% INPM', 'Reduz 99,99% bactérias', '500ml', '5L'],
    images: ['/img/products/gel-fresh-500ml.jpeg'],
    versions: [
      { label: '500ml', price: 19.90, stock: 145, weight: 600, sku: 'BKR-GF-500' },
      { label: '1L', price: 32.90, stock: 76, weight: 1100, sku: 'BKR-GF-1L' },
      { label: '5L', price: 89.90, stock: 34, weight: 5300, sku: 'BKR-GF-5L' },
    ],
  },

  // ============ BECKER PRO ============
  {
    slug: 'limpador-perfumado-5l', sku: 'BKR-PRO-LP-5L',
    name: 'Limpador Perfumado PRO 5L',
    category: 'pro',
    shortDescription: 'Para condomínios, escritórios e empresas.',
    description: 'Limpador perfumado especialmente elaborado com perfume diferenciado.',
    highlights: ['Para empresas', '5L', '4 fragrâncias', 'Rende muito'],
    images: ['/img/products/limpador-perfumado-5l.jpeg'],
    versions: [
      { label: '5L Ocean', price: 49.90, stock: 67, weight: 5300, sku: 'BKR-PRO-LP-5L-OCE' },
      { label: '5L Bamboo', price: 49.90, stock: 45, weight: 5300, sku: 'BKR-PRO-LP-5L-BAM' },
      { label: '5L Flores do Campo', price: 49.90, stock: 38, weight: 5300, sku: 'BKR-PRO-LP-5L-FLO' },
    ],
  },
];

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
