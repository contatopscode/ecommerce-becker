export const metadata = {
  title: 'Política de Privacidade',
  description: 'Como coletamos, usamos e protegemos seus dados pessoais conforme a LGPD.',
};

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-becker-cream/30">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <a href="/" className="text-sm text-becker-purple font-semibold hover:underline mb-4 inline-block">
          ← Voltar para a loja
        </a>

        <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">Política de Privacidade</h1>
        <p className="text-sm text-becker-slate mb-8">Última atualização: 08/08/2026</p>

        <div className="bg-white rounded-2xl border border-becker-line p-6 lg:p-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-extrabold mb-3">1. Quem somos</h2>
            <p>
              A <strong>Becker</strong> é uma indústria de produtos de limpeza com 40 anos de mercado, comprometida com a privacidade e proteção dos dados pessoais de seus clientes, em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
            <p className="mt-2">
              Este documento explica como coletamos, usamos, armazenamos e protegemos seus dados pessoais em nosso site e canais de atendimento.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">2. Dados que coletamos</h2>
            <p>Coletamos os seguintes dados pessoais:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Identificação:</strong> nome, WhatsApp, e-mail, CPF/CNPJ</li>
              <li><strong>Endereço:</strong> CEP, rua, número, complemento, bairro, cidade, UF</li>
              <li><strong>Pedidos:</strong> produtos comprados, valores, histórico</li>
              <li><strong>Pagamento:</strong> dados processados por gateway (não armazenamos cartão)</li>
              <li><strong>Navegação:</strong> páginas visitadas, produtos visualizados (com seu consentimento)</li>
              <li><strong>Comunicações:</strong> mensagens trocadas via WhatsApp</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">3. Como usamos seus dados</h2>
            <p>Seus dados são utilizados para:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Processar pedidos e entregas</li>
              <li>Emitir nota fiscal e cumprir obrigações legais</li>
              <li>Enviar comunicações sobre seus pedidos (WhatsApp/e-mail)</li>
              <li>Atendimento ao cliente via WhatsApp e e-mail</li>
              <li>Melhorias no site (com seu consentimento para analytics)</li>
              <li>Marketing e anúncios personalizados (apenas com seu consentimento)</li>
              <li>Prevenção de fraude e segurança</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">4. Cookies e tecnologias</h2>
            <p>
              Utilizamos cookies para:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Essenciais:</strong> manter você logado e seu carrinho salvo</li>
              <li><strong>Analytics:</strong> entender o uso do site (apenas com consentimento)</li>
              <li><strong>Marketing:</strong> anúncios personalizados (apenas com consentimento)</li>
            </ul>
            <p className="mt-2">
              Você pode gerenciar suas preferências de cookies a qualquer momento através do banner exibido no site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">5. Compartilhamento de dados</h2>
            <p>
              Compartilhamos seus dados apenas com:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Transportadoras (para entrega)</li>
              <li>Gateway de pagamento (para processar pagamento)</li>
              <li>Provedor de NF (para emissão fiscal)</li>
              <li>Evolution API (para envio de WhatsApp)</li>
              <li>OpenAI (para assistente IA, dados anônimos)</li>
            </ul>
            <p className="mt-2">
              <strong>Não vendemos</strong> seus dados pessoais a terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">6. Seus direitos (LGPD)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar anonimização, bloqueio ou eliminação</li>
              <li>Solicitar portabilidade</li>
              <li>Revogar consentimento</li>
            </ul>
            <p className="mt-2">
              Para exercer seus direitos, entre em contato: <strong>privacidade@becker.com.br</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">7. Segurança</h2>
            <p>
              Adotamos medidas técnicas e organizacionais para proteger seus dados:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>HTTPS com SSL (Caddy + Let's Encrypt)</li>
              <li>Cookies httpOnly e SameSite</li>
              <li>Senhas hasheadas (sha256)</li>
              <li>Autenticação 2FA para administradores</li>
              <li>Backup automático diário do banco</li>
              <li>Rate limiting em APIs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">8. Retenção de dados</h2>
            <p>
              Mantemos seus dados pelo período necessário para:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Cumprir obrigações legais e fiscais (mínimo 5 anos)</li>
              <li>Resolver disputas</li>
              <li>Fazer valer nossos termos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">9. Encarregado de Dados (DPO)</h2>
            <p>
              <strong>E-mail:</strong> dpo@becker.com.br<br />
              <strong>WhatsApp:</strong> (81) 99944-1333
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">10. Mudanças nesta política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou aviso no site.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
