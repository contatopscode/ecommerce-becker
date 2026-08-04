// ============================================================
// Home - página inicial
// ============================================================

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import { ProductCard } from '@/components/ProductCard';
import { fetchProducts, fetchCategories } from '@/lib/products';

export const revalidate = 60; // ISR: revalidar a cada 60s

export default async function HomePage() {
  const [categories, topProducts, featured, eco] = await Promise.all([
    fetchCategories(),
    fetchProducts({ isTop: true, take: 8 }),
    fetchProducts({ isFeatured: true, take: 3 }),
    fetchProducts({ isEco: true, take: 1 }),
  ]);

  const heroProduct = featured[0];
  const topHero = topProducts[0];

  return (
    <>
      <Header />

      {/* HERO */}
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
                href="/categoria/todos"
                className="bg-becker-orange hover:brightness-95 transition text-white font-semibold px-6 py-3.5 rounded-full shadow-pop inline-flex items-center gap-2"
              >
                Comprar agora
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
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
                <div className="display text-3xl font-extrabold">{topProducts.length * 5}+</div>
                <div className="text-xs text-white/70">produtos</div>
              </div>
              <div>
                <div className="display text-3xl font-extrabold">4.9★</div>
                <div className="text-xs text-white/70">avaliação clientes</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              {heroProduct && (
                <Link
                  href={`/produto/${heroProduct.slug}`}
                  className="product-img rounded-3xl p-4 aspect-[3/4] flex flex-col justify-between shadow-pop ring-soft overflow-hidden"
                >
                  <span className="inline-flex w-fit items-center gap-1 bg-becker-orange text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full z-10">
                    Top seller
                  </span>
                  <div className="flex-1 grid place-items-center py-2">
                    {heroProduct.images[0] && (
                      <img
                        src={heroProduct.images[0].url}
                        alt={heroProduct.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                  <div>
                    <div className="display font-bold text-becker-ink line-clamp-2">{heroProduct.name}</div>
                    <div className="text-sm text-becker-slate line-clamp-1">
                      {heroProduct.shortDescription}
                    </div>
                  </div>
                </Link>
              )}
              <div className="grid gap-4">
                {eco[0] && (
                  <Link
                    href={`/produto/${eco[0].slug}`}
                    className="product-img rounded-3xl p-3 aspect-square flex flex-col justify-between shadow-card overflow-hidden"
                  >
                    <span className="inline-flex w-fit items-center gap-1 bg-eco-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full z-10">
                      🌿 ECO
                    </span>
                    <div className="flex-1 grid place-items-center">
                      {eco[0].images[0] && (
                        <img src={eco[0].images[0].url} alt={eco[0].name} className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                    <div>
                      <div className="display font-bold text-becker-ink text-sm line-clamp-1">{eco[0].name}</div>
                    </div>
                  </Link>
                )}
                {topHero && (
                  <Link
                    href={`/produto/${topHero.slug}`}
                    className="product-img rounded-3xl p-3 aspect-square flex flex-col justify-between shadow-card overflow-hidden"
                  >
                    <span className="inline-flex w-fit items-center gap-1 bg-becker-purple text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full z-10">
                      -15%
                    </span>
                    <div className="flex-1 grid place-items-center">
                      {topHero.images[0] && (
                        <img src={topHero.images[0].url} alt={topHero.name} className="max-h-full max-w-full object-contain" />
                      )}
                    </div>
                    <div>
                      <div className="display font-bold text-becker-ink text-sm line-clamp-1">{topHero.name}</div>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIAS */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-becker-orange font-semibold text-sm uppercase tracking-widest">Explore</p>
            <h2 className="display text-3xl lg:text-4xl font-extrabold mt-1">Categorias</h2>
          </div>
          <Link href="/categoria/todos" className="text-sm font-semibold text-becker-purple hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.slice(0, 12).map((c) => (
            <Link
              key={c.id}
              href={`/categoria/${c.slug}`}
              className="group bg-white rounded-2xl p-5 border border-becker-line hover:border-becker-purple hover:shadow-soft transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-becker-purple-soft grid place-items-center text-2xl mb-3">
                {c.icon || '📦'}
              </div>
              <div className="font-semibold text-sm">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* DESTAQUES (banner) */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative overflow-hidden rounded-3xl gradient-purple text-white p-8 lg:p-10">
            <div className="absolute -right-10 -top-10 w-72 h-72 bg-white/10 rounded-full blur-2xl" />
            <div className="relative max-w-md">
              <span className="inline-block bg-becker-orange px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">
                Combo da semana
              </span>
              <h3 className="display text-3xl lg:text-4xl font-extrabold leading-tight mb-3">
                Lava Roupas + Amaciante com <span className="text-becker-orange">25% off</span>
              </h3>
              <p className="text-white/80 mb-6">Garanta o combo completo Becker.</p>
              <Link href="/categoria/lava-roupas" className="inline-flex items-center gap-2 bg-white text-becker-purple font-semibold px-5 py-3 rounded-full hover:bg-becker-cream transition">
                Aproveitar →
              </Link>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-3xl bg-eco-500 text-white p-8">
            <span className="inline-block bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase mb-4">Linha Eco</span>
            <h3 className="display text-2xl font-extrabold mb-3">100% energia renovável</h3>
            <p className="text-white/85 text-sm mb-6">Sabão vegetal + energia solar.</p>
            <Link href="/categoria/eco" className="inline-flex items-center gap-2 bg-white text-eco-600 font-semibold px-5 py-3 rounded-full">
              Conhecer →
            </Link>
          </div>
        </div>
      </section>

      {/* TOP DA SEMANA */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-becker-orange font-semibold text-sm uppercase tracking-widest">Mais vendidos</p>
            <h2 className="display text-3xl lg:text-4xl font-extrabold mt-1">Top da semana</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {topProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            href="/categoria/todos"
            className="inline-flex items-center gap-2 border-2 border-becker-purple text-becker-purple hover:bg-becker-purple hover:text-white font-semibold px-6 py-3 rounded-full transition"
          >
            Ver todos os produtos
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
              <path d="M5 12h14M13 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* LINHAS */}
      <section className="bg-becker-purple text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 dotted-bg opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-becker-orange font-semibold text-sm uppercase tracking-widest">Nossas linhas</p>
            <h2 className="display text-3xl lg:text-4xl font-extrabold mt-1">Soluções para cada momento</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <Link href="/categoria/todos" className="group bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur rounded-3xl p-7 transition">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="display text-2xl font-bold">Linha Doméstica</h3>
              <p className="text-white/70 text-sm mt-2 mb-5">Tudo o que sua casa precisa.</p>
              <span className="inline-flex items-center gap-1 text-becker-orange font-semibold text-sm">Explorar →</span>
            </Link>
            <Link href="/empresas" className="group bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur rounded-3xl p-7 transition">
              <div className="text-5xl mb-4">🏭</div>
              <h3 className="display text-2xl font-bold">Linha Industrial</h3>
              <p className="text-white/70 text-sm mt-2 mb-5">Alta performance para empresas.</p>
              <span className="inline-flex items-center gap-1 text-becker-orange font-semibold text-sm">Cotação →</span>
            </Link>
            <Link href="/categoria/pro" className="group bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur rounded-3xl p-7 transition">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="display text-2xl font-bold">Becker PRO</h3>
              <p className="text-white/70 text-sm mt-2 mb-5">Linha profissional concentrada.</p>
              <span className="inline-flex items-center gap-1 text-becker-orange font-semibold text-sm">Conhecer →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* PWA Install hint */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl border border-becker-line p-8 flex flex-col sm:flex-row items-center gap-6">
            <div className="text-7xl">⚡</div>
            <div>
              <h3 className="display text-2xl font-extrabold">Adicione à tela inicial</h3>
              <p className="text-becker-slate text-sm mt-1 mb-4">
                Acesse a Becker em 1 toque direto da tela do seu celular, sem precisar baixar nada.
              </p>
              <p className="text-xs text-becker-slate">
                Toque em <strong>Compartilhar</strong> e depois em <strong>"Adicionar à tela de início"</strong>
              </p>
            </div>
          </div>
          <div className="bg-becker-orange text-white rounded-3xl p-8">
            <h3 className="display text-2xl font-extrabold mb-1">Ganhe 10% OFF</h3>
            <p className="text-white/90 text-sm mb-4">
              Use o cupom <strong className="bg-white/20 px-2 py-0.5 rounded">BECKER10</strong> na primeira compra.
            </p>
            <Link href="/categoria/todos" className="inline-block bg-white text-becker-orange font-bold px-5 py-2.5 rounded-full text-sm">
              Aproveitar
            </Link>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </>
  );
}
