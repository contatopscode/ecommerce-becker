# Dicionário de Dados — Becker E-commerce

> Documentação de todas as tabelas, colunas, tipos e constraints do banco PostgreSQL.
> Baseado no schema Prisma em `packages/db/prisma/schema.prisma`.

---

## Índice

1. [User](#user)
2. [Address](#address)
3. [Category](#category)
4. [Product](#product)
5. [ProductImage](#productimage)
6. [ProductVersion](#productversion)
7. [Order](#order)
8. [OrderItem](#orderitem)
9. [Coupon](#coupon)
10. [Review](#review)
11. [WhatsAppConversation](#whatsappconversation)
12. [Newsletter](#newsletter)
13. [Setting](#setting)
14. [Enums](#enums)

---

## User

Usuários da plataforma. Inclui clientes finais, admins e super admins.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `name` | String | ❌ | — | Nome completo do usuário |
| `whatsapp` | String (unique) | ❌ | — | WhatsApp com DDI+DDD (ex: `5581999999999`) |
| `email` | String (unique) | ✅ | — | E-mail (opcional) |
| `cpfCnpj` | String (unique) | ✅ | — | CPF ou CNPJ (opcional) |
| `passwordHash` | String | ✅ | — | Hash de senha (raro, pois usamos OTP) |
| `role` | `Role` (enum) | ❌ | `CUSTOMER` | Papel: CUSTOMER, ADMIN, SUPER_ADMIN |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |
| `updatedAt` | DateTime | ❌ | `updatedAt` | Última atualização |

**Índices:** `whatsapp` (unique)

**Relações:**
- `addresses` → 1:N com Address
- `orders` → 1:N com Order
- `reviews` → 1:N com Review

---

## Address

Endereços de entrega. Um usuário pode ter múltiplos endereços.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `userId` | String | ❌ | — | FK para User |
| `cep` | String | ❌ | — | CEP (8 dígitos, sem máscara) |
| `street` | String | ❌ | — | Logradouro (rua, avenida, etc) |
| `number` | String | ❌ | — | Número |
| `complement` | String | ✅ | — | Complemento (apto, bloco, etc) |
| `district` | String | ❌ | — | Bairro |
| `city` | String | ❌ | — | Cidade |
| `state` | String | ❌ | — | UF (2 letras) |
| `isDefault` | Boolean | ❌ | `false` | Endereço padrão do usuário |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |

**Índices:** `userId`

**Relações:**
- `user` → N:1 com User (Cascade delete)
- `orders` → 1:N com Order

---

## Category

Categorias de produtos (ex: Limpeza, Cozinha, Banheiro).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `slug` | String (unique) | ❌ | — | Slug URL-friendly (ex: `limpeza-cozinha`) |
| `name` | String | ❌ | — | Nome da categoria |
| `description` | String | ✅ | — | Descrição da categoria |
| `icon` | String | ✅ | — | Ícone (emoji ou URL) |
| `color` | String | ✅ | — | Cor da categoria (hex) |
| `order` | Int | ❌ | `0` | Ordem de exibição |
| `active` | Boolean | ❌ | `true` | Categoria ativa |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |
| `updatedAt` | DateTime | ❌ | `updatedAt` | Última atualização |

**Relações:**
- `products` → 1:N com Product

---

## Product

Produtos do catálogo Becker.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `slug` | String (unique) | ❌ | — | Slug URL-friendly (ex: `detergente-lavanda-500ml`) |
| `sku` | String (unique) | ❌ | — | SKU do produto |
| `name` | String | ❌ | — | Nome do produto |
| `description` | Text | ❌ | — | Descrição completa (markdown/HTML) |
| `shortDescription` | String | ✅ | — | Descrição curta (cards, listagem) |
| `brand` | String | ❌ | `"Becker"` | Marca (sempre Becker) |
| `categoryId` | String | ❌ | — | FK para Category |
| `isEco` | Boolean | ❌ | `false` | Produto ecológico (selo verde) |
| `isFeatured` | Boolean | ❌ | `false` | Destaque na home |
| `isTop` | Boolean | ❌ | `false` | Produto top (vitrine) |
| `isNew` | Boolean | ❌ | `false` | Lançamento |
| `active` | Boolean | ❌ | `true` | Produto ativo (soft delete) |
| `rating` | Float | ❌ | `0` | Avaliação média (0-5) |
| `reviewCount` | Int | ❌ | `0` | Quantidade de reviews |
| `highlights` | String[] | ❌ | `[]` | Bullet points de destaque |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |
| `updatedAt` | DateTime | ❌ | `updatedAt` | Última atualização |

**Índices:** `categoryId`, `slug` (unique), `isTop`, `isFeatured`

**Relações:**
- `category` → N:1 com Category
- `images` → 1:N com ProductImage
- `versions` → 1:N com ProductVersion
- `reviews` → 1:N com Review

---

## ProductImage

Imagens de um produto. Suporta múltiplas imagens com ordem.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `productId` | String | ❌ | — | FK para Product |
| `url` | String | ❌ | — | URL da imagem |
| `alt` | String | ✅ | — | Texto alternativo (acessibilidade) |
| `order` | Int | ❌ | `0` | Ordem de exibição |
| `isPrimary` | Boolean | ❌ | `false` | Imagem principal (capa) |

**Índices:** `productId`

**Relações:**
- `product` → N:1 com Product (Cascade delete)

---

## ProductVersion

Variações de um produto (tamanho, fragrância, embalagem). Cada versão tem preço, estoque e dimensões próprios.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `productId` | String | ❌ | — | FK para Product |
| `sku` | String (unique) | ❌ | — | SKU da versão |
| `label` | String | ❌ | — | Label (ex: `"500ml Lavanda"`, `"3L"`) |
| `price` | Decimal(10,2) | ❌ | — | Preço de venda |
| `originalPrice` | Decimal(10,2) | ✅ | — | Preço original (riscado, em promoção) |
| `stock` | Int | ❌ | `0` | Estoque disponível |
| `weight` | Int | ✅ | — | Peso em gramas (cálculo de frete) |
| `height` | Int | ✅ | — | Altura em mm |
| `width` | Int | ✅ | — | Largura em mm |
| `length` | Int | ✅ | — | Comprimento em mm |
| `barcode` | String | ✅ | — | Código de barras (EAN) |
| `active` | Boolean | ❌ | `true` | Versão ativa |

**Índices:** `productId`, `sku` (unique)

**Relações:**
- `product` → N:1 com Product (Cascade delete)

---

## Order

Pedidos realizados na loja.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `number` | String (unique) | ❌ | — | Número do pedido (ex: `BKR-202608-000123`) |
| `userId` | String | ✅ | — | FK para User (null = guest) |
| `guestEmail` | String | ✅ | — | E-mail do guest (sem cadastro) |
| `guestWhatsapp` | String | ✅ | — | WhatsApp do guest |
| `addressId` | String | ✅ | — | FK para Address |
| `subtotal` | Decimal(10,2) | ❌ | — | Subtotal (soma dos itens) |
| `shipping` | Decimal(10,2) | ❌ | — | Valor do frete |
| `discount` | Decimal(10,2) | ❌ | `0` | Desconto aplicado |
| `total` | Decimal(10,2) | ❌ | — | Total final (subtotal - discount + shipping) |
| `status` | `OrderStatus` (enum) | ❌ | `PENDING` | Status do pedido |
| `paymentStatus` | `PaymentStatus` (enum) | ❌ | `PENDING` | Status do pagamento |
| `source` | `OrderSource` (enum) | ❌ | `SITE` | Origem do pedido |
| `paymentId` | String | ✅ | — | ID do pagamento no gateway |
| `paymentMethod` | `PaymentMethod` (enum) | ✅ | — | Método: pix, credit_card, boleto |
| `tracking` | String | ✅ | — | Código de rastreio |
| `shippingMethod` | `ShippingMethod` (enum) | ✅ | `free` | Método: free, pac, sedex |
| `notes` | String | ✅ | — | Observações do cliente |
| `paidAt` | DateTime | ✅ | — | Data do pagamento |
| `shippedAt` | DateTime | ✅ | — | Data do envio |
| `deliveredAt` | DateTime | ✅ | — | Data da entrega |
| `cancelledAt` | DateTime | ✅ | — | Data do cancelamento |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |
| `updatedAt` | DateTime | ❌ | `updatedAt` | Última atualização |

**Índices:** `userId`, `number` (unique), `status`, `createdAt`

**Relações:**
- `user` → N:1 com User
- `address` → N:1 com Address
- `items` → 1:N com OrderItem (Cascade delete)

---

## OrderItem

Itens de um pedido. Salva snapshot do produto (nome, preço) para preservar histórico.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `orderId` | String | ❌ | — | FK para Order |
| `productId` | String | ❌ | — | FK para Product |
| `productName` | String | ❌ | — | **Snapshot** do nome do produto |
| `versionId` | String | ❌ | — | FK para ProductVersion |
| `versionLabel` | String | ❌ | — | **Snapshot** do label da versão |
| `sku` | String | ❌ | — | SKU da versão |
| `price` | Decimal(10,2) | ❌ | — | Preço unitário no momento da compra |
| `qty` | Int | ❌ | — | Quantidade |
| `total` | Decimal(10,2) | ❌ | — | Total do item (price × qty) |

**Índices:** `orderId`

**Relações:**
- `order` → N:1 com Order (Cascade delete)

---

## Coupon

Cupons de desconto.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `code` | String (unique) | ❌ | — | Código do cupom (ex: `BECKER15`) |
| `type` | String | ❌ | — | Tipo: `percent`, `fixed`, `shipping` |
| `discount` | Float | ❌ | — | Valor do desconto (% ou R$) |
| `minOrder` | Float | ❌ | `0` | Pedido mínimo para aplicar |
| `maxUses` | Int | ✅ | — | Máximo de usos (null = ilimitado) |
| `usedCount` | Int | ❌ | `0` | Quantas vezes foi usado |
| `expiresAt` | DateTime | ✅ | — | Data de expiração |
| `active` | Boolean | ❌ | `true` | Cupom ativo |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |
| `updatedAt` | DateTime | ❌ | `updatedAt` | Última atualização |

**Nota:** O campo `type` é String (não enum) para flexibilidade, mas valores válidos: `percent`, `fixed`, `shipping`. Existe enum `CouponType` mas não está sendo usado atualmente.

---

## Review

Avaliações de produtos feitas por clientes.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `productId` | String | ❌ | — | FK para Product |
| `userId` | String | ❌ | — | FK para User |
| `rating` | Int | ❌ | — | Nota de 1 a 5 |
| `title` | String | ✅ | — | Título da avaliação |
| `comment` | String | ✅ | — | Comentário |
| `approved` | Boolean | ❌ | `false` | Review aprovado pelo admin |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |

**Índices:** `productId`, `(productId, userId)` (unique)

**Relações:**
- `product` → N:1 com Product (Cascade delete)
- `user` → N:1 com User

---

## WhatsAppConversation

Conversas de WhatsApp com a IA. Armazena histórico e contexto do bot.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `phone` | String | ❌ | — | WhatsApp do cliente (DDI+DDD+número) |
| `customerName` | String | ✅ | — | Nome do cliente (se identificado) |
| `messages` | Json | ❌ | — | Array de mensagens (role, content, timestamp) |
| `context` | Json | ✅ | — | Estado do bot (qual fluxo está) |
| `resolved` | Boolean | ❌ | `false` | Conversa resolvida |
| `humanTakeover` | Boolean | ❌ | `false` | Transferido para humano |
| `lastMessageAt` | DateTime | ❌ | `now()` | Última mensagem recebida |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |

**Índices:** `phone`, `lastMessageAt`

**Estrutura de `messages`:**
```json
[
  { "role": "user", "content": "oi", "timestamp": "2026-08-08T..." },
  { "role": "assistant", "content": "Olá! Como posso ajudar?", "timestamp": "2026-08-08T..." }
]
```

**Estrutura de `context`:**
```json
{
  "intent": "buy_product",
  "step": "collecting_items",
  "cart": [...],
  "cep": "50000-000"
}
```

---

## Newsletter

E-mails cadastrados na newsletter.

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `email` | String (unique) | ❌ | — | E-mail do assinante |
| `active` | Boolean | ❌ | `true` | Assinatura ativa |
| `createdAt` | DateTime | ❌ | `now()` | Data de inscrição |

---

## Setting

Configurações gerais do sistema (chave-valor).

| Campo | Tipo | Nullable | Default | Descrição |
|-------|------|----------|---------|-----------|
| `id` | String (cuid) | ❌ | auto | Identificador único |
| `key` | String (unique) | ❌ | — | Chave da config (ex: `shipping_free_min`) |
| `value` | String | ❌ | — | Valor da config |
| `category` | String | ❌ | `"general"` | Categoria: shipping, promo, integrations, general |
| `label` | String | ✅ | — | Label amigável (UI) |
| `type` | String | ❌ | `"text"` | Tipo: text, number, boolean, json |
| `createdAt` | DateTime | ❌ | `now()` | Data de criação |
| `updatedAt` | DateTime | ❌ | `updatedAt` | Última atualização |

**Categorias:**
- `shipping` — regras de frete e entrega
- `promo` — promoções e cupons
- `integrations` — credenciais de integrações
- `general` — configurações gerais da loja

**Exemplos de keys:**
- `shipping_free_min` — valor mínimo para frete grátis
- `shipping_default_weight` — peso padrão (gramas)
- `promo_first_buy_coupon` — cupom automático de primeira compra
- `integrations_evolution_url` — URL da Evolution API
- `integrations_admin_whatsapp` — WhatsApp do admin
- `general_store_phone` — telefone da loja
- `general_store_email` — e-mail da loja

---

## Enums

### `Role`
- `CUSTOMER` — cliente final (padrão)
- `ADMIN` — administrador
- `SUPER_ADMIN` — super administrador (acesso total)

### `OrderStatus`
- `PENDING` — aguardando pagamento
- `PAID` — pago
- `PROCESSING` — em separação
- `SHIPPED` — enviado
- `DELIVERED` — entregue
- `CANCELLED` — cancelado
- `REFUNDED` — reembolsado

### `PaymentStatus`
- `PENDING` — aguardando
- `PAID` — pago
- `FAILED` — falhou
- `REFUNDED` — reembolsado

### `OrderSource`
- `SITE` — site (web)
- `WHATSAPP` — via WhatsApp (bot IA)
- `ADMIN` — criado manualmente pelo admin

### `PaymentMethod`
- `pix` — PIX
- `credit_card` — cartão de crédito
- `boleto` — boleto bancário

### `ShippingMethod`
- `free` — frete grátis
- `pac` — PAC (Correios)
- `sedex` — SEDEX (Correios)

### `CouponType` (enum não usado atualmente, `Coupon.type` é String)
- `PERCENT` — desconto percentual
- `FIXED` — desconto fixo (R$)
- `FREE_SHIPPING` — frete grátis

---

## Regras de Negócio Importantes

### WhatsApp
- **SEMPRE** armazenar com DDI+DDD+número (ex: `5581999999999`)
- **SEM o 9** depois do DDD (WhatsApp Business API não aceita)
- Sistema normaliza automaticamente (remove o 9)

### Soft Delete
- **Product.active = false** = produto inativo (não aparece na loja)
- **Nunca** fazer hard delete (preserva histórico de pedidos)

### Snapshots
- `OrderItem.productName`, `versionLabel`, `price` são **snapshots** do momento da compra
- Mesmo que o produto mude depois, o pedido mantém os dados originais

### Pedidos
- Número do pedido formato: `BKR-YYYYMM-NNNNNN` (ex: `BKR-202608-000123`)
- Total = subtotal - discount + shipping
- Status começa em `PENDING` e transita para `PAID` via webhook de pagamento

### Cupons
- `type: "percent"` → `discount` é percentual (0-100)
- `type: "fixed"` → `discount` é valor em R$
- `type: "shipping"` → libera frete grátis (independente de `discount`)
- `usedCount` deve ser incrementado ao usar

---

**Última atualização:** 08/08/2026
