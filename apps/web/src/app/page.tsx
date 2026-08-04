import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Top bar */}
      <div className="bg-becker-purple text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <span>🌿 Linha 100% biodegradável · 🚚 Frete grátis para todo o Brasil</span>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-purple dotted-bg opacity-95" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-becker-orange/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 bg-becker-blue/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-14 lg:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div className="text-white fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-5">
              <span className="w-2 h-2 bg-becker-orange rounded-full pulse-dot" />
              NOVO · Linha Becker PRO
            </div>
            <h1 className="display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-5">
              Limpeza que <span className="text-becker-orange">cuida</span> de verdade.
            </h1>
            <p className="text-white/85 text-lg max-w-xl mb-7">
              40 anos transformando lares brasileiros. Produtos eficientes, biodegradáveis e com a qualidade industrial que só a Becker tem.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className="bg-becker-orange hover:brightness-95 transition text-white font-semibold px-6 py-3.5 rounded-full shadow-pop inline-flex items-center gap-2"
              >
                Comprar agora →
              </Link>
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5581999022262'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 border border-white/30 transition text-white font-semibold px-6 py-3.5 rounded-full"
              >
                Pedir pelo WhatsApp
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              <div>
                <div className="display text-3xl font-extrabold">40+</div>
                <div className="text-xs text-white/70">anos de mercado</div>
              </div>
              <div>
                <div className="display text-3xl font-extrabold">300+</div>
                <div className="text-xs text-white/70">produtos</div>
              </div>
              <div>
                <div className="display text-3xl font-extrabold">4.9★</div>
                <div className="text-xs text-white/70">avaliação clientes</div>
              </div>
            </div>
          </div>

          {/* Placeholder imagem */}
          <div className="relative">
            <div className="bg-white/10 backdrop-blur rounded-3xl aspect-square grid place-items-center text-white/50 text-6xl">
              📦
            </div>
          </div>
        </div>
      </section>

      {/* Status badge */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-becker-line p-8 text-center">
          <span className="inline-block bg-eco-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
            MVP em construção
          </span>
          <h2 className="display text-2xl font-extrabold mb-2">Setup do monorepo concluído! 🎉</h2>
          <p className="text-becker-slate">
            Next.js 14 + TypeScript + Tailwind + Prisma + Postgres. Próximos passos: catálogo, carrinho, checkout, WhatsApp.
          </p>
        </div>
      </section>
    </main>
  );
}
