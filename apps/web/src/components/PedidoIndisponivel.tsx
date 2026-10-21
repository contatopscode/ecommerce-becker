// Página única para pedido inexistente e para pedido sem autorização (não revela qual dos dois).

import Link from 'next/link';
import { PageShell } from '@/components/PageShell';

export function PedidoIndisponivel() {
  return (
    <PageShell>
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-extrabold mb-3">Não encontramos este pedido</h1>
        <p className="text-becker-slate mb-6">
          O link pode estar incompleto ou vencido, ou o pedido pertence a outra conta. Por segurança, não mostramos
          pedidos sem confirmar que são seus.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/conta" className="bg-becker-purple text-white font-semibold px-6 py-3 rounded-full">
            Entrar na sua conta
          </Link>
          <Link href="/rastrear" className="border border-becker-purple text-becker-purple font-semibold px-6 py-3 rounded-full">
            Rastrear com número e telefone
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
