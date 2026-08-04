// ============================================================
// Footer
// ============================================================

import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-becker-ink text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-becker-purple grid place-items-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white">
                <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth={2} />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="display font-extrabold text-xl">Becker</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">Linha Doméstica</div>
            </div>
          </div>
          <p className="text-sm text-white/70">
            40 anos cuidando do seu lar com sustentabilidade, qualidade e o carinho que só a Becker tem.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-3 text-sm">Loja</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/categoria/lava-roupas" className="hover:text-white">Lava Roupas</Link></li>
            <li><Link href="/categoria/multiuso" className="hover:text-white">Multiuso</Link></li>
            <li><Link href="/categoria/desinfetantes" className="hover:text-white">Desinfetantes</Link></li>
            <li><Link href="/categoria/eco" className="hover:text-white">🌿 Linha Eco</Link></li>
            <li><Link href="/ofertas" className="hover:text-white">Ofertas</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3 text-sm">Atendimento</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/conta" className="hover:text-white">Minha conta</Link></li>
            <li><Link href="/rastrear" className="hover:text-white">Rastrear pedido</Link></li>
            <li><Link href="/atendimento" className="hover:text-white">Central de ajuda</Link></li>
            <li><a href="https://wa.me/5581999022262" target="_blank" rel="noopener noreferrer" className="hover:text-white">Falar no WhatsApp</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3 text-sm">Empresa</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/sobre" className="hover:text-white">Sobre a Becker</Link></li>
            <li><Link href="/sobre" className="hover:text-white">Sustentabilidade</Link></li>
            <li><Link href="/empresas" className="hover:text-white">Becker Empresas</Link></li>
            <li><Link href="/admin" className="hover:text-white">Painel admin</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/60">
          <div>© 2026 Becker Indústria de Produtos de Limpeza. CNPJ 00.000.000/0001-00.</div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-white">Política de privacidade</Link>
            <Link href="#" className="hover:text-white">Termos de uso</Link>
            <span>🇧🇷 BR</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
