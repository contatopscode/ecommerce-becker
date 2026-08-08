export const metadata = {
  title: 'Termos de Uso',
  description: 'Termos e condições de uso da loja Becker.',
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-becker-cream/30">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <a href="/" className="text-sm text-becker-purple font-semibold hover:underline mb-4 inline-block">
          ← Voltar para a loja
        </a>

        <h1 className="text-3xl lg:text-4xl font-extrabold mb-2">Termos de Uso</h1>
        <p className="text-sm text-becker-slate mb-8">Última atualização: 08/08/2026</p>

        <div className="bg-white rounded-2xl border border-becker-line p-6 lg:p-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-extrabold mb-3">1. Aceitação</h2>
            <p>
              Ao acessar e usar o site <strong>becker.pscode.ia.br</strong>, você concorda com estes Termos de Uso e com nossa <a href="/privacidade" className="text-becker-purple underline">Política de Privacidade</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">2. Cadastro</h2>
            <p>
              Para fazer pedidos, você precisa fornecer um WhatsApp válido. Opcionalmente pode cadastrar nome, e-mail e CPF/CNPJ. Você é responsável por manter seus dados atualizados e pela veracidade das informações.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">3. Pedidos e Pagamento</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Pedidos são processados após confirmação de pagamento</li>
              <li>Preços e disponibilidade podem ser alterados sem aviso prévio</li>
              <li>Promoções são por tempo limitado e sujeitas a termos específicos</li>
              <li>Reservamo-nos o direito de cancelar pedidos suspeitos de fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">4. Entrega</h2>
            <p>
              A entrega é realizada por transportadora ou motoboy parceiro, no endereço informado no pedido. Prazos e valores são informados no checkout e podem variar por região.
            </p>
            <p className="mt-2">
              É responsabilidade do cliente garantir que alguém esteja no endereço para receber a entrega.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">5. Trocas e Devoluções</h2>
            <p>
              Conforme o Código de Defesa do Consumidor (Lei 8.078/90), você tem até <strong>7 dias corridos</strong> após o recebimento para solicitar arrependimento. O produto deve estar em perfeitas condições.
            </p>
            <p className="mt-2">
              Para defeitos de fabricação, o prazo é de <strong>30 dias</strong>. Entre em contato pelo nosso WhatsApp para iniciar o processo.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">6. Preços</h2>
            <p>
              Todos os preços estão em Reais (BRL) e podem sofrer alterações sem aviso prévio. O preço válido é o confirmado no momento da finalização do pedido.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">7. Propriedade Intelectual</h2>
            <p>
              Todo o conteúdo do site (textos, imagens, logos, marcas) é de propriedade da Becker ou licenciado, sendo proibida a reprodução sem autorização.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">8. Limitação de Responsabilidade</h2>
            <p>
              A Becker não se responsabiliza por:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Danos causados por uso indevido dos produtos</li>
              <li>Atrasos decorrentes de força maior</li>
              <li>Problemas técnicos no acesso ao site</li>
              <li>Informações incorretas fornecidas pelo cliente</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">9. Foro</h2>
            <p>
              Fica eleito o foro da Comarca de Recife/PE para dirimir quaisquer questões, com renúncia a qualquer outro, por mais privilegiado que seja.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-extrabold mb-3">10. Contato</h2>
            <p>
              <strong>E-mail:</strong> sac@becker.com.br<br />
              <strong>WhatsApp:</strong> (81) 99902-2262<br />
              <strong>Horário de atendimento:</strong> Seg-Sex, 8h às 18h
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
