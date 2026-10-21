// ============================================================
// Página /kits - Lista os kits Becker
// Server Component que chama Prisma direto (página estática-ish)
// ============================================================

import { PageShell } from '@/components/PageShell';
import { KitCard } from '@/components/KitCard';
import { fetchActiveKits } from '@/lib/kits';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Kits Becker | Becker',
  description:
    'Kit Essencial do Apartamento Becker: cinco produtos de limpeza por R$ 52,50. 40 anos cuidando da sua casa.',
};

export default async function KitsPage() {
  const kits = await fetchActiveKits();

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-br from-becker-purple to-becker-purple-deep text-white rounded-3xl p-8 mb-10 text-center">
          <div className="inline-block bg-eco-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full mb-3">
            ✨ Combos prontos
          </div>
          <h1 className="display text-4xl lg:text-5xl font-extrabold mb-3">
            Kits Becker
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Selecionamos os produtos que combinam entre si e montamos kits prontos.
            É só escolher e pronto: sua casa fica resolvida.
          </p>
        </div>

        {kits.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-becker-slate">Nenhum kit disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kits.map((k) => (
              <KitCard key={k.id} kit={k} />
            ))}
          </div>
        )}

        {/* CTA rodapé */}
        <div className="mt-12 text-center">
          <p className="text-becker-slate text-sm">
            Quer um kit personalizado? <a href="https://wa.me/5581999022262" className="text-becker-purple font-semibold hover:underline">Fala com a gente no WhatsApp</a>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
