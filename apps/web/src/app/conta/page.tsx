// ============================================================
// Minha Conta (placeholder, expandível)
// ============================================================

import { PageShell } from '@/components/PageShell';
import Link from 'next/link';

export default function ContaPage() {
  return (
    <PageShell>
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-becker-line p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl gradient-purple mx-auto grid place-items-center text-white text-2xl mb-3">👤</div>
            <h1 className="display text-2xl font-extrabold">Entrar na Becker</h1>
            <p className="text-becker-slate text-sm">Acesse sua conta com seu WhatsApp</p>
          </div>
          <div className="space-y-3">
            <input type="text" placeholder="(11) 99999-9999" className="w-full border border-becker-line rounded-xl px-4 py-3 focus:outline-none focus:border-becker-purple" />
            <button className="w-full bg-becker-purple text-white font-semibold py-3 rounded-full">Enviar código por WhatsApp</button>
            <div className="text-center text-sm text-becker-slate">ou</div>
            <button className="w-full border border-becker-line text-becker-ink font-semibold py-3 rounded-full">
              Continuar com Google
            </button>
          </div>
          <div className="text-center mt-6 text-xs text-becker-slate">
            Conta criada automaticamente no seu primeiro pedido ✨
          </div>
          <div className="text-center mt-4 text-sm">
            <Link href="/rastrear" className="text-becker-purple font-semibold hover:underline">
              Rastrear um pedido sem login →
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
