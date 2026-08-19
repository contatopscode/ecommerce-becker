// ============================================================
// Página /kits/[slug] - Detalhe do kit
// Mostra: nome, descrição, itens inclusos, preço, botão comprar
// ============================================================

import { notFound } from 'next/navigation';
import { PageShell } from '@/components/PageShell';
import { KitDetail } from './KitDetail';
import { prisma } from '@becker/db';
import { ensureKitsSeeded } from '@/lib/ensure-kits-seeded';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const kit = await prisma.kit.findUnique({ where: { slug } });
  if (!kit) return { title: 'Kit não encontrado' };
  return {
    title: `${kit.name} | Kits Becker`,
    description: kit.shortDescription || kit.description.substring(0, 160),
  };
}

export default async function KitDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await ensureKitsSeeded();

  const kit = await prisma.kit.findUnique({
    where: { slug },
    include: {
      items: true,
    },
  });

  if (!kit || !kit.isActive) notFound();

  // Enriquece com dados de produtos (pra mostrar imagens, slugs)
  const productIds = kit.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
    },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  return (
    <PageShell>
      <KitDetail
        kit={{
          id: kit.id,
          slug: kit.slug,
          name: kit.name,
          shortDescription: kit.shortDescription,
          description: kit.description,
          category: kit.category,
          image: kit.image,
          price: Number(kit.price),
          originalPrice: Number(kit.originalPrice),
          discountPercent: kit.discountPercent,
          isFeatured: kit.isFeatured,
          items: kit.items.map((it) => {
            const product = productMap.get(it.productId);
            return {
              productId: it.productId,
              productSlug: product?.slug,
              productName: it.productName,
              image: product?.images[0]?.url,
              versionLabel: it.versionLabel,
              qty: it.qty,
            };
          }),
        }}
      />
    </PageShell>
  );
}
