// ============================================================
// Atendimento - FAQ + WhatsApp
// ============================================================

import { PageShell } from '@/components/PageShell';

const FAQ = [
  { q: 'Como rastrear meu pedido?', a: 'Você recebe o código de rastreio por WhatsApp e e-mail. Ou acesse "Rastrear" no menu e informe o número do pedido ou WhatsApp.' },
  { q: 'Qual o prazo de entrega?', a: 'Frete grátis padrão: 5 a 9 dias úteis para todo o Brasil.' },
  { q: 'Posso trocar ou devolver?', a: 'Sim! Você tem 7 dias após o recebimento, conforme o CDC.' },
  { q: 'Como pagar com Pix?', a: 'Ao finalizar o pedido, escolha Pix. Você recebe o QR Code na hora e tem 5% de desconto.' },
  { q: 'Vocês entregam em todo o Brasil?', a: 'Sim, entregamos em todos os estados.' },
  { q: 'Como comprar pelo WhatsApp?', a: 'Clique no botão verde do site ou dos produtos. Te atendemos na hora.' },
];

export default function AtendimentoPage() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="display text-3xl font-extrabold mb-2">Como podemos ajudar?</h1>
        <p className="text-becker-slate mb-8">Estamos aqui pra te atender. Escolha um canal abaixo.</p>

        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <a href="https://wa.me/5581999022262?text=Oi! Preciso de ajuda" target="_blank" rel="noopener noreferrer" className="bg-green-500 text-white rounded-2xl p-6 hover:bg-green-600 transition">
            <div className="text-3xl mb-2">💬</div>
            <h3 className="display text-xl font-extrabold">WhatsApp</h3>
            <p className="text-white/85 text-sm">Resposta rápida, em horário comercial</p>
            <div className="mt-3 text-sm font-semibold">+55 81 99902-2262 →</div>
          </a>
          <a href="mailto:contato@becker.com.br" className="bg-becker-purple text-white rounded-2xl p-6 hover:bg-becker-purple-deep transition">
            <div className="text-3xl mb-2">📧</div>
            <h3 className="display text-xl font-extrabold">E-mail</h3>
            <p className="text-white/85 text-sm">Para casos não urgentes</p>
            <div className="mt-3 text-sm font-semibold">contato@becker.com.br →</div>
          </a>
        </div>

        <div className="bg-white rounded-3xl border border-becker-line p-8">
          <h2 className="display text-2xl font-extrabold mb-6">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <details key={i} className="group border border-becker-line rounded-2xl">
                <summary className="p-4 font-semibold flex items-center justify-between cursor-pointer">
                  {f.q}
                  <span className="text-becker-purple group-open:rotate-45 transition text-2xl">+</span>
                </summary>
                <div className="px-4 pb-4 text-sm text-becker-slate">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
