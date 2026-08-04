// ============================================================
// Admin Configurações
// ============================================================

import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AdminConfigPage() {
  const session = await getSession();

  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_DOMAIN || 'https://becker.pscode.ia.br'}/api/webhooks/evolution`;

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-becker-ink mb-6">Configurações</h1>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl border border-becker-line p-6">
          <h2 className="text-xl font-extrabold mb-2">🔗 Webhook Evolution API</h2>
          <p className="text-sm text-becker-slate mb-4">
            Configure este webhook no painel da Evolution API para receber mensagens do WhatsApp.
          </p>
          <div className="bg-becker-cream rounded-xl p-4 space-y-3">
            <div>
              <div className="text-xs text-becker-slate font-semibold uppercase">URL do Webhook</div>
              <div className="font-mono text-sm bg-white border border-becker-line rounded px-3 py-2 mt-1 break-all">
                {webhookUrl}
              </div>
            </div>
            <div>
              <div className="text-xs text-becker-slate font-semibold uppercase">Eventos</div>
              <div className="font-mono text-sm bg-white border border-becker-line rounded px-3 py-2 mt-1">
                messages.upsert
              </div>
            </div>
            <div>
              <div className="text-xs text-becker-slate font-semibold uppercase">Método</div>
              <div className="font-mono text-sm bg-white border border-becker-line rounded px-3 py-2 mt-1">
                POST (JSON)
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-becker-slate">
            <strong>Como configurar:</strong> No painel da Evolution API, vá em
            <code className="mx-1 bg-becker-cream px-1.5 py-0.5 rounded">Webhook</code>
            e adicione a URL acima. Marque o evento "messages.upsert" e ative.
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-becker-line p-6">
          <h2 className="text-xl font-extrabold mb-4">🔐 Sua sessão</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-becker-slate">Nome:</span> <strong>{session?.name}</strong></div>
            <div><span className="text-becker-slate">WhatsApp:</span> <strong>{session?.whatsapp}</strong></div>
            <div><span className="text-becker-slate">Role:</span> <strong>{session?.role}</strong></div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-becker-line p-6">
          <h2 className="text-xl font-extrabold mb-2">🤖 Agente IA</h2>
          <p className="text-sm text-becker-slate">
            Status: <strong className="text-eco-600">Ativo</strong> (com fallback)
          </p>
          <p className="text-xs text-becker-slate mt-2">
            Configure a variável de ambiente <code className="bg-becker-cream px-1.5 py-0.5 rounded">OPENAI_API_KEY</code> para ativar GPT-4o-mini.
            Sem ela, o agente usa respostas pré-definidas para os fluxos conhecidos.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-becker-line p-6">
          <h2 className="text-xl font-extrabold mb-2">💬 WhatsApp</h2>
          <p className="text-sm text-becker-slate">
            Instância: <strong>Vigilia</strong>
          </p>
          <p className="text-sm text-becker-slate">
            Status: <strong className="text-eco-600">Conectada</strong>
          </p>
          <p className="text-xs text-becker-slate mt-2">
            Configurado via variáveis de ambiente <code className="bg-becker-cream px-1.5 py-0.5 rounded">EVOLUTION_*</code>.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-becker-line p-6">
          <h2 className="text-xl font-extrabold mb-2">🗄️ Banco de Dados</h2>
          <p className="text-sm text-becker-slate">
            PostgreSQL 17 na VPS (213.199.32.229:5432/banco2026)
          </p>
          <p className="text-xs text-becker-slate mt-2">
            Use o Prisma Studio para inspecionar: <code className="bg-becker-cream px-1.5 py-0.5 rounded">pnpm db:studio</code>
          </p>
        </section>
      </div>
    </div>
  );
}
