# API Reference — Becker E-commerce

> Documentação de todos os endpoints da API (Next.js API Routes).
> Base: `apps/web/src/app/api/`

**Base URL (produção):** `https://becker.pscode.ia.br/api`

---

## Índice

1. [Autenticação](#1-autenticação)
2. [Cliente — Conta](#2-cliente--conta)
3. [Cliente — Checkout](#3-cliente--checkout)
4. [Pedidos](#4-pedidos)
5. [Produtos e Busca](#5-produtos-e-busca)
6. [Frete e CEP](#6-frete-e-cep)
7. [Cupons](#7-cupons)
8. [Wishlist](#8-wishlist)
9. [Admin — Produtos](#9-admin--produtos)
10. [Admin — Pedidos](#10-admin--pedidos)
11. [Admin — Clientes](#11-admin--clientes)
12. [Admin — Configurações](#12-admin--configurações)
13. [Admin — Notificações](#13-admin--notificações)
14. [Webhooks](#14-webhooks)
15. [Health Check](#15-health-check)

---

## Convenção

- **Método:** `GET`, `POST`, `PUT`, `DELETE`
- **Auth:** 🔓 público, 🔒 requer sessão, 🔐 requer admin
- **Resposta:** sempre JSON
- **Erro padrão:** `{ "error": "mensagem" }` com status 4xx/5xx

---

## 1. Autenticação

### `POST /api/auth/otp/request` 🔓

Solicita código OTP (enviado por WhatsApp).

**Body:**
```json
{
  "whatsapp": "5581999999999"
}
```

**Resposta (200):**
```json
{
  "ok": true,
  "message": "Código enviado para seu WhatsApp"
}
```

**Erros:**
- `400` — WhatsApp inválido
- `429` — Muitas tentativas (rate limit)

---

### `POST /api/auth/otp/verify` 🔓

Verifica código OTP e cria sessão.

**Body:**
```json
{
  "whatsapp": "5581999999999",
  "code": "123456"
}
```

**Resposta (200):**
```json
{
  "ok": true,
  "user": {
    "id": "user_id",
    "name": "Maria Silva",
    "whatsapp": "5581999999999",
    "role": "CUSTOMER"
  }
}
```

**Sessão:** cookie httpOnly `becker_session` (30 dias)

**Erros:**
- `400` — Código inválido ou expirado
- `404` — WhatsApp não encontrado

---

### `GET /api/auth/session` 🔓

Retorna sessão atual.

**Resposta (200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "Maria Silva",
    "whatsapp": "5581999999999",
    "role": "CUSTOMER"
  }
}
```

**Sem sessão:** `null`

---

### `POST /api/auth/logout` 🔒

Encerra sessão.

**Resposta (200):**
```json
{
  "ok": true
}
```

---

## 2. Cliente — Conta

### `GET /api/conta/pedidos` 🔒

Lista pedidos do usuário logado.

**Resposta (200):**
```json
{
  "orders": [
    {
      "id": "order_id",
      "number": "BKR-202608-000123",
      "status": "PAID",
      "paymentStatus": "PAID",
      "total": 159.90,
      "items": [...],
      "createdAt": "2026-08-08T..."
    }
  ]
}
```

---

## 3. Cliente — Checkout

### `GET /api/customer/by-whatsapp` 🔓

Busca cliente por WhatsApp (pré-cadastro).

**Query:** `?whatsapp=5581999999999`

**Resposta (200):**
```json
{
  "exists": true,
  "customer": {
    "id": "user_id",
    "name": "Maria Silva",
    "whatsapp": "5581999999999",
    "addresses": [...]
  }
}
```

**Cliente novo:** `{ "exists": false }`

---

### `POST /api/checkout/save-progress` 🔓

Salva progresso do checkout (recuperação se fechar aba).

**Body:**
```json
{
  "whatsapp": "5581999999999",
  "step": 2,
  "data": {
    "address": {...},
    "shipping": {...},
    "items": [...]
  }
}
```

**Resposta (200):**
```json
{
  "ok": true
}
```

---

## 4. Pedidos

### `POST /api/orders/create` 🔓

Cria novo pedido.

**Body:**
```json
{
  "userId": "user_id (opcional)",
  "guestEmail": "maria@email.com (opcional)",
  "guestWhatsapp": "5581999999999",
  "address": {
    "cep": "50000000",
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 45",
    "district": "Boa Viagem",
    "city": "Recife",
    "state": "PE"
  },
  "items": [
    {
      "productId": "product_id",
      "versionId": "version_id",
      "qty": 2
    }
  ],
  "shipping": {
    "method": "pac",
    "price": 22.90,
    "days": "4 a 6 dias úteis"
  },
  "payment": {
    "method": "pix"
  },
  "coupon": "BECKER15 (opcional)"
}
```

**Resposta (201):**
```json
{
  "ok": true,
  "order": {
    "id": "order_id",
    "number": "BKR-202608-000123",
    "total": 159.90,
    "status": "PENDING",
    "paymentStatus": "PENDING"
  }
}
```

**Erros:**
- `400` — Dados inválidos / estoque insuficiente
- `404` — Produto não encontrado
- `500` — Erro ao criar pedido

**Efeitos colaterais:**
- Decrementa estoque das versões
- Envia WhatsApp para cliente (pedido criado)
- Envia WhatsApp para admin (novo pedido)
- Cria pré-cadastro se WhatsApp novo

---

### `POST /api/orders/simulate-payment` 🔓

⚠️ **SIMULADO** — Marca pedido como pago (apenas para testes). Será removido quando Mercado Pago for integrado.

**Body:**
```json
{
  "orderId": "order_id"
}
```

**Resposta (200):**
```json
{
  "ok": true,
  "order": { "status": "PAID", "paymentStatus": "PAID" }
}
```

---

## 5. Produtos e Busca

### `GET /api/search` 🔓

Busca produtos com filtros.

**Query params:**
- `q` — termo de busca
- `category` — slug da categoria
- `minPrice`, `maxPrice` — faixa de preço
- `brand` — marca
- `eco` — `true` para só eco
- `sort` — `price-asc`, `price-desc`, `name`, `newest`
- `page` — paginação (default 1)
- `limit` — itens por página (default 20)

**Exemplo:** `/api/search?q=detergente&category=cozinha&sort=price-asc`

**Resposta (200):**
```json
{
  "products": [
    {
      "id": "product_id",
      "slug": "detergente-lavanda-500ml",
      "name": "Detergente Lavanda 500ml",
      "shortDescription": "...",
      "price": 8.90,
      "originalPrice": 10.90,
      "images": [{ "url": "...", "isPrimary": true }],
      "category": { "name": "Cozinha", "slug": "cozinha" },
      "isEco": false,
      "isTop": true
    }
  ],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

---

## 6. Frete e CEP

### `GET /api/cep` 🔓

Busca endereço por CEP (ViaCEP).

**Query:** `?cep=50000000`

**Resposta (200):**
```json
{
  "cep": "50000-000",
  "street": "Rua Exemplo",
  "district": "Boa Viagem",
  "city": "Recife",
  "state": "PE"
}
```

**Erros:**
- `400` — CEP inválido
- `404` — CEP não encontrado

---

### `POST /api/shipping/calculate` 🔓

Calcula opções de frete.

**Body:**
```json
{
  "cep": "50000000",
  "items": [
    { "productId": "...", "versionId": "...", "qty": 2, "weight": 500 }
  ]
}
```

**Resposta (200):**
```json
{
  "options": [
    {
      "id": "free",
      "name": "Frete Grátis",
      "description": "Entrega padrão (PAC)",
      "price": 0,
      "days": "4 a 6 dias úteis",
      "carrier": "Correios"
    },
    {
      "id": "pac",
      "name": "PAC",
      "description": "Entrega econômica",
      "price": 22.90,
      "days": "4 a 6 dias úteis",
      "carrier": "Correios"
    },
    {
      "id": "sedex",
      "name": "SEDEX",
      "description": "Entrega expressa",
      "price": 39.90,
      "days": "1 a 2 dias úteis",
      "carrier": "Correios"
    }
  ]
}
```

> **Nota:** Cálculo é mockado por enquanto (baseado em CEP + valor do pedido). Integração com transportadora real é sprint futura.

---

## 7. Cupons

### `POST /api/cupom/validate` 🔓

Valida cupom de desconto.

**Body:**
```json
{
  "code": "BECKER15",
  "orderTotal": 159.90
}
```

**Resposta (200):**
```json
{
  "ok": true,
  "coupon": {
    "code": "BECKER15",
    "type": "percent",
    "discount": 15,
    "discountValue": 23.99
  }
}
```

**Erros:**
- `400` — Cupom inválido, expirado, ou não atinge pedido mínimo
- `404` — Cupom não encontrado
- `409` — Cupom já usado pelo cliente (limite atingido)

---

## 8. Wishlist

### `GET /api/wishlist` 🔒

Lista wishlist do usuário.

**Resposta (200):**
```json
{
  "products": [...]
}
```

---

### `POST /api/wishlist` 🔒

Adiciona produto à wishlist.

**Body:**
```json
{
  "productId": "product_id"
}
```

**Resposta (200):**
```json
{ "ok": true }
```

---

### `DELETE /api/wishlist` 🔒

Remove produto da wishlist.

**Body:**
```json
{
  "productId": "product_id"
}
```

---

## 9. Admin — Produtos

### `GET /api/admin/produtos` 🔐

Lista todos os produtos (incluindo inativos).

**Resposta (200):**
```json
{
  "products": [
    {
      "id": "...",
      "name": "...",
      "sku": "...",
      "category": {...},
      "versions": [...],
      "active": true,
      "stock": 42
    }
  ]
}
```

---

### `POST /api/admin/produtos` 🔐

Cria novo produto.

**Body:**
```json
{
  "name": "Novo Produto",
  "slug": "novo-produto",
  "sku": "BKR-001",
  "description": "Descrição completa",
  "shortDescription": "Descrição curta",
  "categoryId": "category_id",
  "isEco": false,
  "isFeatured": false,
  "isTop": false,
  "isNew": true,
  "highlights": ["destaque 1", "destaque 2"],
  "images": [{ "url": "...", "alt": "...", "isPrimary": true }],
  "versions": [
    {
      "label": "500ml",
      "sku": "BKR-001-500",
      "price": 8.90,
      "stock": 100,
      "weight": 500
    }
  ]
}
```

**Resposta (201):**
```json
{ "ok": true, "productId": "..." }
```

---

### `PUT /api/admin/produtos/[id]` 🔐

Atualiza produto existente.

**Body:** (mesmo formato do POST, parcial)

---

### `DELETE /api/admin/produtos/[id]` 🔐

Soft delete (marca `active = false`).

**Resposta (200):**
```json
{ "ok": true }
```

---

### `POST /api/admin/produtos/toggle` 🔐

Toggle ativo/inativo.

**Body:**
```json
{
  "productId": "product_id"
}
```

---

## 10. Admin — Pedidos

### `POST /api/admin/pedidos/status` 🔐

Atualiza status de pedido (envia WhatsApp automático).

**Body:**
```json
{
  "orderId": "order_id",
  "status": "PROCESSING",
  "tracking": "BR123456789 (opcional)"
}
```

**Valores válidos para `status`:**
- `PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`

**Resposta (200):**
```json
{ "ok": true, "order": {...} }
```

**Efeitos colaterais:**
- Atualiza status do pedido
- Se `SHIPPED`, salva `shippedAt` e código de rastreio
- Envia WhatsApp para cliente com template apropriado

---

## 11. Admin — Clientes

### `POST /api/admin/clientes/role` 🔐

Promove/rebaixa role de usuário.

**Body:**
```json
{
  "userId": "user_id",
  "role": "ADMIN"
}
```

**Valores:** `CUSTOMER`, `ADMIN`, `SUPER_ADMIN`

⚠️ Apenas `SUPER_ADMIN` pode promover outros para `ADMIN`/`SUPER_ADMIN`.

---

## 12. Admin — Configurações

### `POST /api/admin/settings/save` 🔐

Salva configurações gerais.

**Body:**
```json
{
  "settings": {
    "shipping_free_min": "199",
    "shipping_default_weight": "1000",
    "promo_first_buy_coupon": "BECKER15",
    "integrations_evolution_url": "https://...",
    "integrations_evolution_key": "...",
    "integrations_admin_whatsapp": "5581999441333",
    "general_store_phone": "8133334444",
    "general_store_email": "contato@becker.com.br"
  }
}
```

**Resposta (200):**
```json
{ "ok": true }
```

---

## 13. Admin — Notificações

### `POST /api/admin/notify-test` 🔐

Envia WhatsApp de teste para o admin (botão "Enviar mensagem de teste").

**Resposta (200):**
```json
{ "ok": true, "messageId": "..." }
```

**Erros:**
- `400` — Evolution API não configurada
- `500` — Erro na Evolution

---

## 14. Webhooks

### `POST /api/webhooks/evolution` 🔓 (com validação)

Webhook da Evolution API (mensagens WhatsApp recebidas).

**Body (exemplo):**
```json
{
  "event": "messages.upsert",
  "instance": "Vigilia",
  "data": {
    "key": {
      "remoteJid": "5581999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "ABC123"
    },
    "message": {
      "conversation": "oi"
    }
  }
}
```

**Comportamento:**
- Salva mensagem em `WhatsAppConversation`
- Detecta intent local (regex)
- Se intent conhecida: responde sem chamar OpenAI
- Se não: chama GPT-4o-mini
- Envia resposta via Evolution

**Resposta:** `200 OK`

---

### `POST /api/webhooks/mercadopago` 🔓 (a implementar)

> 📌 **Sprint 6** — será implementado quando gateway for definido.

Webhook de pagamento confirmado:
- Atualiza `Order.status = PAID` e `paymentStatus = PAID`
- Envia WhatsApp cliente (pagamento aprovado)
- Envia WhatsApp admin (pagamento confirmado)
- Salva `paidAt`

---

## 15. Health Check

### `GET /api/health` 🔓

Verifica saúde do sistema.

**Resposta (200):**
```json
{
  "status": "ok",
  "timestamp": "2026-08-08T10:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "evolution": "ok",
    "openai": "ok"
  }
}
```

**Erro (503):**
```json
{
  "status": "error",
  "checks": {
    "database": "error: connection refused"
  }
}
```

---

## Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| `200` | Sucesso |
| `201` | Criado |
| `400` | Requisição inválida |
| `401` | Não autenticado |
| `403` | Sem permissão |
| `404` | Não encontrado |
| `409` | Conflito (ex: cupom já usado) |
| `429` | Rate limit excedido |
| `500` | Erro interno |

---

## Rate Limiting

> 📌 **Sprint 14** — será implementado.

Limites planejados:
- `POST /api/auth/otp/request`: 5 req / 15min por IP
- `POST /api/orders/create`: 10 req / hora por IP
- Endpoints admin: 100 req / minuto por usuário

---

## Versionamento

Atualmente em **v1** (sem versionamento na URL).
Futuras breaking changes usarão `/api/v2/...`.

---

**Última atualização:** 08/08/2026
