// ============================================================
// Becker Empresas (B2B)
// ============================================================

'use client';

import { PageShell } from '@/components/PageShell';

export default function EmpresasPage() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-becker-purple text-white rounded-3xl p-8 lg:p-12 text-center mb-8">
          <h1 className="display text-3xl lg:text-5xl font-extrabold mb-4">Becker Empresas</h1>
          <p className="text-white/85 text-lg max-w-2xl mx-auto mb-6">
            Soluções em limpeza para condomínios, hotéis, indústrias, escritórios e revendedores.
          </p>
          <a href="https://wa.me/5581999022262?text=Quero cotação para empresa" target="_blank" rel="noopener noreferrer" className="inline-block bg-becker-orange text-white font-bold px-6 py-3 rounded-full">
            Solicitar cotação
          </a>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-becker-line p-6">
            <div className="text-3xl mb-3">🏢</div>
            <h3 className="font-bold mb-2">Condomínios</h3>
            <p className="text-sm text-becker-slate">Produtos de alta performance para áreas comuns, com entrega programada.</p>
          </div>
          <div className="bg-white rounded-2xl border border-becker-line p-6">
            <div className="text-3xl mb-3">🏨</div>
            <h3 className="font-bold mb-2">Hotelaria</h3>
            <p className="text-sm text-becker-slate">Linha profissional com produtos concentrados.</p>
          </div>
          <div className="bg-white rounded-2xl border border-becker-line p-6">
            <div className="text-3xl mb-3">🏭</div>
            <h3 className="font-bold mb-2">Indústrias</h3>
            <p className="text-sm text-becker-slate">Linha industrial com alta performance e suporte técnico.</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-becker-line p-8">
          <h2 className="display text-xl font-extrabold mb-4">Receba uma cotação</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert('Recebemos sua solicitação! Em breve entraremos em contato.');
            }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <input type="text" required placeholder="Nome da empresa" className="border border-becker-line rounded-xl px-4 py-3" />
            <input type="text" required placeholder="CNPJ" className="border border-becker-line rounded-xl px-4 py-3" />
            <input type="text" required placeholder="Nome do responsável" className="border border-becker-line rounded-xl px-4 py-3" />
            <input type="text" required placeholder="WhatsApp" className="border border-becker-line rounded-xl px-4 py-3" />
            <input type="email" placeholder="E-mail" className="border border-becker-line rounded-xl px-4 py-3 sm:col-span-2" />
            <textarea placeholder="Quais produtos te interessam?" className="sm:col-span-2 border border-becker-line rounded-xl px-4 py-3" rows={3} />
            <button type="submit" className="sm:col-span-2 bg-becker-purple text-white font-semibold py-3 rounded-full">
              Enviar solicitação
            </button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
