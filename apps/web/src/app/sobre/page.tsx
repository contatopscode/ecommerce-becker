// ============================================================
// Sobre a Becker
// ============================================================

import { PageShell } from '@/components/PageShell';

export default function SobrePage() {
  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="display text-4xl lg:text-5xl font-extrabold mb-4">40 anos cuidando do seu lar</h1>
          <p className="text-becker-slate text-lg max-w-2xl mx-auto">
            Desde 1983, a Becker transforma a vida das pessoas através de produtos de limpeza eficientes, sustentáveis e acessíveis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-12">
          <div className="bg-becker-purple text-white rounded-3xl p-8">
            <h2 className="display text-2xl font-extrabold mb-3">🌱 Sustentabilidade</h2>
            <p className="text-white/85 mb-4">Acreditamos que cuidar da casa é também cuidar do planeta.</p>
            <ul className="space-y-2 text-sm">
              <li>✓ Usina solar própria (100% energia renovável)</li>
              <li>✓ Tratamento de efluentes</li>
              <li>✓ Produtos biodegradáveis</li>
              <li>✓ Linha Eco com sabão vegetal</li>
              <li>✓ Embalagens 100% recicláveis</li>
            </ul>
          </div>
          <div className="bg-eco-500 text-white rounded-3xl p-8">
            <h2 className="display text-2xl font-extrabold mb-3">🏆 Tradição</h2>
            <p className="text-white/85 mb-4">Pioneirismo que faz a diferença:</p>
            <ul className="space-y-2 text-sm">
              <li>✓ Desde 1983 no mercado</li>
              <li>✓ 1ª escola de limpeza do Brasil</li>
              <li>✓ Mais de 300 produtos no portfólio</li>
              <li>✓ Presença em todo o Brasil</li>
              <li>✓ Atende pessoa física e empresas</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-becker-line p-8">
          <h2 className="display text-2xl font-extrabold mb-6 text-center">Nossos números</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div><div className="display text-3xl font-extrabold text-becker-purple">40+</div><div className="text-xs text-becker-slate">anos</div></div>
            <div><div className="display text-3xl font-extrabold text-becker-purple">300+</div><div className="text-xs text-becker-slate">produtos</div></div>
            <div><div className="display text-3xl font-extrabold text-becker-purple">3</div><div className="text-xs text-becker-slate">unidades (PE, RN, SP)</div></div>
            <div><div className="display text-3xl font-extrabold text-becker-purple">4.9★</div><div className="text-xs text-becker-slate">avaliação</div></div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
