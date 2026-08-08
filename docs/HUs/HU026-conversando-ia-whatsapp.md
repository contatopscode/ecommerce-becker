---
hu_id: HU026
status: Aprovado
release: v1.0
modulo: WhatsApp
prioridade: Alta
demanda: becker-ecommerce
---

### HU026 — Conversando com a IA no WhatsApp

**Como:** cliente que mandou mensagem no WhatsApp da Becker
**Quero:** receber respostas inteligentes sobre produtos, pedidos e ajuda em geral
**Para que:** resolver minhas dúvidas sem precisar ligar ou ir na loja

#### Critérios de Aceitação
1. Cliente manda mensagem no WhatsApp da Becker (Evolution API)
2. Sistema detecta intent localmente (regex) ANTES de chamar OpenAI
3. Se intent conhecida: responde sem gastar tokens da OpenAI
4. Se não: chama GPT-4o-mini com system prompt especializado
5. Contexto da conversa é persistido em `WhatsAppConversation`
6. Histórico é mantido entre mensagens
7. Se cliente pedir humano, marca `humanTakeover = true`
8. Respostas curtas (máx 3 parágrafos) com tom brasileiro

#### Requisitos Funcionais

##### Webhook da Evolution API
Endpoint `POST /api/webhooks/evolution`:
- Recebe `{ event: "messages.upsert", data: {...} }`
- Extrai: phone, message text, customer name
- Ignora mensagens enviadas pela própria Becker (`fromMe: true`)
- Salva mensagem em `WhatsAppConversation.messages`

##### Detecção Local de Intent (Regex)
Padrões reconhecidos sem chamar OpenAI:
- `^(oi|olá|ola|hey|hi)` → saudação (resposta fixa)
- `(preço|valor|quanto custa|quanto é)` → pedir nome do produto
- `(frete|entrega|prazo)` → pedir CEP
- `(status|pedido|acompanhar|rastrear)` → pedir número do pedido
- `(humano|atendente|pessoa|representante)` → transferir para humano
- `(cancelar|cancelamento)` → confirmar cancelamento
- `(cupom|desconto|promoção)` → listar cupons ativos
- `(catálogo|catalogo|produtos|ver produtos)` → enviar link do site

##### Chamada OpenAI (quando necessário)
- Model: `gpt-4o-mini`
- Temperature: 0.7
- Max tokens: 500
- System prompt especializado em Becker (40 anos de mercado)
- Histórico: últimas 10 mensagens da conversa
- Tools: `consultar_produto`, `consultar_pedido`, `calcular_frete`

##### Contexto da Conversa
`WhatsAppConversation.context` (JSON):
```json
{
  "intent": "buy_product",
  "step": "collecting_items",
  "cart": [{"productId": "...", "qty": 2}],
  "cep": "50000-000",
  "customerName": "Maria"
}
```

##### Transferência para Humano
- Cliente pede humano OU IA não sabe responder
- Marca `humanTakeover = true`
- Notifica admin via WhatsApp
- Próximas mensagens: respondidas manualmente

#### Regras de Negócio
- **RN01** — SEMPRE tentar detecção local antes de chamar OpenAI (economia)
- **RN02** — Respostas curtas (máx 3 parágrafos, 1-2 emojis)
- **RN03** — Manter histórico: últimas 10 mensagens para contexto
- **RN04** — Idioma: português brasileiro
- **RN05** — Tom: simpático, objetivo, com emojis moderados

#### Fluxos de Exceção
- **OpenAI fora do ar:** responder "Tô com problema técnico, um atendente vai te ajudar"
- **Mensagem vazia ou só emojis:** responder "Como posso ajudar?"
- **Mensagem de áudio:** responder "Por favor, envie mensagem de texto"
- **Cliente xingando/ofendendo:** pedir desculpas, oferecer humano
- **Fora do horário:** responder "Atendimento humano das 8h às 18h. Deixa seu pedido que respondo depois"

#### Dependências
- Evolution API
- OpenAI API (gpt-4o-mini)
- HU001 (catálogo de produtos)
- HU020 (criação de pedido)
- HU021 (rastreamento de pedido)
