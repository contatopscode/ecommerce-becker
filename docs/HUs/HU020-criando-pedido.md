---
hu_id: HU020
status: Aprovado
release: v1.0
modulo: Pedidos
prioridade: Alta
demanda: becker-ecommerce
---

### HU020 — Criando pedido com snapshot de itens

**Como:** sistema (após confirmação do checkout)
**Quero:** criar um pedido completo no banco com todos os dados necessários
**Para que:** o cliente receba seus produtos e a operação tenha rastreabilidade

#### Critérios de Aceitação
1. Pedido criado com número único formato `BKR-YYYYMM-NNNNNN`
2. Status inicial: `PENDING` (aguardando pagamento)
3. Payment status inicial: `PENDING`
4. Endereço de entrega vinculado (FK Address)
5. Itens salvos com snapshot (nome, preço, versão, SKU) — não confiar só em FK
6. Estoque das versões decrementado
7. WhatsApp enviado para cliente (template "pedido criado")
8. WhatsApp enviado para admin (template "novo pedido")
9. Total = subtotal - desconto + frete
10. Source padrão = `SITE` (checkout web)

#### Requisitos Funcionais

##### Geração de Número do Pedido
Formato: `BKR-YYYYMM-NNNNNN` onde:
- `BKR` = prefixo fixo
- `YYYYMM` = ano e mês atual
- `NNNNNN` = sequência de 6 dígitos (zeros à esquerda)

Exemplo: `BKR-202608-000123`

##### Validações
- Estoque disponível em todas as versões
- Produtos ativos (`active = true`)
- Endereço completo
- Subtotal + frete - desconto = total (consistência)

##### Cálculos
- `subtotal` = soma de (item.price × item.qty)
- `shipping` = valor do frete escolhido
- `discount` = valor do cupom (se houver)
- `total` = subtotal - discount + shipping

##### Snapshots
Cada `OrderItem` salva:
- `productName` (string) — nome atual do produto
- `versionLabel` (string) — label da versão
- `price` (decimal) — preço no momento da compra
- `sku` (string) — SKU da versão

##### Notificações
- **Cliente:** WhatsApp com template "pedido criado" + número do pedido + total
- **Admin:** WhatsApp com template "novo pedido" + número + cliente + total

#### Regras de Negócio
- **RN01** — Estoque decrementado IMEDIATAMENTE ao criar pedido (não espera pagamento)
- **RN02** — Se estoque insuficiente, retornar erro 400 com mensagem específica
- **RN03** — Pedido guest (sem userId) deve ter `guestEmail` E `guestWhatsapp`
- **RN04** — Endereço do pedido é clonado (não compartilhado com Address global)
- **RN05** — Se cupom tiver `maxUses`, incrementar `usedCount`

#### Fluxos de Exceção
- **Estoque insuficiente:** retornar erro 400 com `{ "error": "Estoque insuficiente para X" }`
- **Produto inativo:** retornar erro 400
- **Cupom inválido:** retornar erro 400
- **Erro ao criar pedido (banco):** rollback transacional, retornar 500
- **Erro ao enviar WhatsApp:** logar mas não falhar o pedido (notificação é best-effort)

#### Dependências
- HU013 (checkout)
- HU017 (cupom)
- HU026 (WhatsApp + IA)
- HU038 (notificações admin)
