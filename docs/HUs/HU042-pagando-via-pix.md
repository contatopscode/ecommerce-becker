---
hu_id: HU042
status: Pendente
release: v1.1 (Sprint 6)
modulo: Pagamento
prioridade: Alta
demanda: becker-ecommerce
---

### HU042 — Pagando via PIX

**Como:** cliente no step 4 do checkout
**Quero:** pagar via PIX com QR Code gerado na hora
**Para que:** finalizar a compra de forma rápida e segura

#### Critérios de Aceitação
1. Cliente escolhe "PIX" como forma de pagamento
2. Sistema chama gateway de pagamento (Mercado Pago ou outro a definir)
3. Sistema recebe QR Code PIX + código copia-e-cola
4. Sistema exibe QR Code visual + botão "Copiar código"
5. QR Code expira em 30 minutos
6. Sistema faz polling OU recebe webhook de pagamento
7. Ao detectar pagamento, status do pedido muda para `PAID`
8. Cliente recebe WhatsApp "pagamento aprovado"
9. Admin recebe WhatsApp "pagamento confirmado"
10. Cliente é redirecionado para `/pedido/[number]` com sucesso

#### Requisitos Funcionais

##### Integração com Gateway
Provider: a definir (candidatos: Mercado Pago, PagSeguro, Stripe, Asaas)
- SDK oficial do provider
- Modo sandbox para testes
- Modo produção (credenciais em `.env`)

Variáveis de ambiente:
- `MERCADOPAGO_TOKEN` ou `PAGSEGURO_TOKEN` (a decidir)
- `MERCADOPAGO_PUBLIC_KEY` (se aplicável)
- `MERCADOPAGO_WEBHOOK_SECRET`

##### Criação da Preferência/Pagamento
Endpoint: `POST /api/orders/create` (modificar)
- Após criar Order (PENDING), criar pagamento no gateway
- Body do gateway:
  ```json
  {
    "items": [{ "title": "...", "quantity": 2, "unit_price": 8.90 }],
    "payer": { "email": "...", "identification": { "type": "CPF", "number": "..." } },
    "payment_methods": { "excluded_payment_types": [...], "installments": 1 },
    "notification_url": "https://becker.pscode.ia.br/api/webhooks/[provider]"
  }
  ```
- Resposta: `{ qr_code_base64, qr_code, payment_id, expires_at }`

##### Exibição do QR Code
- Componente: `<PixPayment orderId paymentId />`
- Mostra QR Code visual (imagem base64)
- Botão "Copiar código" (código copia-e-cola)
- Timer de expiração
- Status: "Aguardando pagamento..."

##### Webhook de Confirmação
Endpoint: `POST /api/webhooks/[provider]`
- Recebe notificação do gateway
- Valida assinatura (security)
- Busca pagamento por ID
- Se status = "approved":
  - Atualiza `Order.status = PAID`, `paymentStatus = PAID`
  - Salva `paidAt = now()`
  - Envia WhatsApp cliente (template "pagamento aprovado")
  - Envia WhatsApp admin (template "pagamento confirmado")
  - Retorna 200 OK

##### Polling (fallback)
- Cliente fica na página `/checkout/pagamento/[orderId]`
- Polling a cada 5s para checar status
- Quando muda para PAID, redireciona para `/pedido/[number]`

#### Regras de Negócio
- **RN01** — QR Code expira em 30 minutos (regra do BCB)
- **RN02** — Após expirar, sistema cria novo QR Code
- **RN03** — Webhook tem prioridade sobre polling
- **RN04** — Idempotência: se webhook chega 2x, não duplicar notificação
- **RN05** — Status `FAILED` se pagamento rejeitado (cartão recusado, PIX não pago em 30min)

#### Fluxos de Exceção
- **Gateway fora do ar:** erro 500, mostrar mensagem "Tente novamente ou escolha outro método"
- **Webhook não recebido:** polling detecta após 30s
- **QR Code expirado:** gerar novo automaticamente
- **Pagamento duplicado:** detectar por `paymentId` e reembolsar
- **CPF/CNPJ inválido:** erro de validação no frontend

#### Dependências
- Decisão sobre gateway de pagamento
- Evolution API (notificações WhatsApp)
- HU020 (criação de pedido)
