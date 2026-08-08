'use client';

import { useState } from 'react';
import { toast } from '@/lib/cart';

export default function DevToolsPage() {
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');

  async function runMigration() {
    if (!confirm('Aplicar migrations do Prisma? Pode levar até 60s.')) return;
    setRunning(true);
    setOutput('Aplicando...');
    try {
      const res = await fetch('/api/admin/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast('✅ Schema aplicado!', 'success');
        setOutput(data.output || 'Sucesso');
      } else {
        toast('❌ ' + data.error, 'error');
        setOutput(data.output || data.error);
      }
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
      setOutput(e.message);
    }
    setRunning(false);
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <h1 className="text-2xl lg:text-3xl font-extrabold mb-2">🛠️ Dev Tools</h1>
      <p className="text-becker-slate text-sm mb-6">Ferramentas administrativas avançadas. Use com cuidado.</p>

      <div className="space-y-4">
        {/* Migration */}
        <div className="bg-white rounded-2xl border border-becker-line p-5">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-3xl">🗄️</div>
            <div className="flex-1">
              <div className="font-extrabold mb-1">Aplicar Migrations do Prisma</div>
              <p className="text-sm text-becker-slate">
                Executa <code className="bg-becker-cream px-1 rounded text-xs">prisma db push</code> para sincronizar
                o schema do banco com o <code className="bg-becker-cream px-1 rounded text-xs">schema.prisma</code>.
                Use quando o Easypanel não rebuildou a imagem e a tabela nova não foi criada.
              </p>
            </div>
          </div>

          <button
            onClick={runMigration}
            disabled={running}
            className="w-full bg-becker-purple text-white font-semibold py-2.5 rounded-xl disabled:opacity-50"
          >
            {running ? 'Aplicando... (pode levar até 60s)' : '▶️ Aplicar migrations agora'}
          </button>

          {output && (
            <pre className="mt-3 p-3 bg-becker-cream/30 rounded-xl text-xs overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
              {output}
            </pre>
          )}
        </div>

        {/* Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm">
          <div className="font-bold text-amber-900 mb-1">⚠️ Quando usar?</div>
          <ul className="list-disc pl-5 text-amber-800 space-y-1 text-xs">
            <li>Você mudou o <code>schema.prisma</code> e adicionou tabela nova</li>
            <li>O Easypanel não rebuildou (build ID não mudou)</li>
            <li>Endpoint que usa a tabela nova dá erro "table X does not exist"</li>
            <li><strong>Não precisa</strong> usar se o build foi completo (start.sh já aplica)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
