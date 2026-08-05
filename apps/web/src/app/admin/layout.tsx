// ============================================================
// Admin Layout
// ============================================================

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect('/conta?redirect=/admin');
  }

  if (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN') {
    return (
      <main className="min-h-screen grid place-items-center p-8">
        <div className="bg-white rounded-2xl border border-becker-line p-8 max-w-md text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="display text-2xl font-extrabold mb-2">Acesso restrito</h1>
          <p className="text-becker-slate mb-4">Esta área é só para administradores.</p>
          <p className="text-xs text-becker-slate mb-4">Seu role atual: <strong>{session.role}</strong></p>
          <Link href="/" className="inline-block bg-becker-purple text-white font-semibold px-5 py-2.5 rounded-full">
            Voltar à loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-becker-ink text-white p-4 hidden md:block">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-becker-purple grid place-items-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 text-white">
              <circle cx="12" cy="12" r="6" fill="none" stroke="currentColor" strokeWidth={2} />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <div className="display font-extrabold text-base">Becker</div>
            <div className="text-[10px] uppercase tracking-widest text-white/60">Admin</div>
          </div>
        </Link>

        <nav className="space-y-1">
          {[
            { href: '/admin', icon: '📊', label: 'Dashboard' },
            { href: '/admin/pedidos', icon: '📦', label: 'Pedidos' },
            { href: '/admin/produtos', icon: '🏷️', label: 'Produtos' },
            { href: '/admin/leads', icon: '🎯', label: 'Leads', highlight: true },
            { href: '/admin/conversas', icon: '💬', label: 'Conversas' },
            { href: '/admin/clientes', icon: '👥', label: 'Clientes' },
            { href: '/admin/configuracoes', icon: '⚙️', label: 'Configurações' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 text-sm"
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-white/10">
          <Link href="/" className="flex items-center gap-2 text-sm text-white/60 hover:text-white">
            ← Ver loja
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-becker-ink text-white p-3 z-10 flex items-center justify-between">
        <Link href="/admin" className="display font-extrabold">Becker Admin</Link>
        <div className="flex gap-2">
          <Link href="/admin/pedidos" className="text-sm">📦</Link>
          <Link href="/admin/produtos" className="text-sm">🏷️</Link>
        </div>
      </div>

      <main className="flex-1 p-4 md:p-8 pt-16 md:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
