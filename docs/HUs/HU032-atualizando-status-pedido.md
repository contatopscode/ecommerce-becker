---
hu_id: HU032
status: Aprovado
release: v1.0
modulo: Admin
prioridade: Alta
demanda: becker-ecommerce
---

### HU032 — Atualizando status de pedido (admin)

**Como:** atendente/admin no painel `/admin/pedidos`
**Quero:** mudar o status de um pedido e enviar notificação automática ao cliente
**Para que:** manter o cliente informado e a operação organizada

#### Critérios de Aceitação
1. Admin acessa lista de pedidos em `/admin/pedidos`
2. Pode filtrar por status (PENDING, PAID, PROCESSING, SHIPPED, etc)
3. Clicar em pedido abre detalhes (modal ou página)
4. Admin clica em botão para mudar status
5. Status é atualizado no banco
6. WhatsApp automático é enviado ao cliente com template apropriado
7. Se status for SHIPPED, sistema pede código de rastreio
8. Datas automáticas são salvas (paidAt, shippedAt, deliveredAt)

#### Requisitos Funcionais

##### Listagem de Pedidos
`/admin/pedidos`:
- Tabela com: número, cliente, total, status, data
- Filtros: status, data (período), busca por número/cliente
- Ordenação: mais recentes primeiro
- Paginação: 20 por página

##### Detalhes do Pedido
Modal ou página `/admin/pedidos/[id]`:
- Dados do cliente (nome, WhatsApp, email)
- Endereço de entrega completo
- Itens (com versões)
- Histórico de mudanças de status
- Botão "Mudar status" (dropdown)
- Campo de rastreio (se SHIPPED)

##### Mudança de Status
Endpoint: `POST /api/admin/pedidos/status`
Body: `{ orderId, status, tracking? }`

Validações:
- Apenas admin (role ADMIN ou SUPER_ADMIN)
- Transições válidas:
  - PENDING → PAID, CANCELLED
  - PAID → PROCESSING, CANCELLED, REFUNDED
  - PROCESSING → SHIPPED, CANCELLED
  - SHIPPED → DELIVERED
  - DELIVERED → REFUNDED

Efeitos:
- Atualiza `Order.status`
- Salva data específica (`paidAt`, `shippedAt`, `deliveredAt`, `cancelledAt`)
- Se SHIPPED: salva `tracking` e `shippingMethod`
- Envia WhatsApp para cliente (template apropriado)

##### Templates de Notificação (Cliente)
- **PAID** → "✅ Pagamento aprovado! Estamos separando seu pedido."
- **PROCESSING** → "📦 Seu pedido está em separação."
- **SHIPPED** → "🚚 Seu pedido foi enviado! Rastreio: {tracking}"
- **DELIVERED** → "✅ Pedido entregue. Obrigado por comprar na Becker!"
- **CANCELLED** → "❌ Seu pedido foi cancelado. Motivo: {reason}"

#### Regras de Negócio
- **RN01** — Apenas ADMIN ou SUPER_ADMIN pode mudar status
- **RN02** — Transições seguem fluxo linear (não pode pular)
- **RN03** — Datas automáticas: paidAt, shippedAt, deliveredAt, cancelledAt
- **RN04** — Notificação WhatsApp é obrigatória (best-effort, mas tenta 3x)
- **RN05** — Histórico de mudanças fica em log (audit log futuro)

#### Fluxos de Exceção
- **Transição inválida:** erro 400 "Transição de X para Y não permitida"
- **Sem permissão:** erro 403
- **Pedido não encontrado:** erro 404
- **WhatsApp falha:** logar mas confirmar mudança de status (best-effort)

#### Dependências
- HU027 (notificações WhatsApp)
- HU020 (criação de pedido)
