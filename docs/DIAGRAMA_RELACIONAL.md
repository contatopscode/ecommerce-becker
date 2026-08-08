# Diagrama Relacional — Becker E-commerce

> Diagrama Entidade-Relacionamento do banco PostgreSQL.
> Renderiza em qualquer visualizador Markdown compatível com Mermaid (GitHub, GitLab, VSCode, Obsidian, etc).

---

## Diagrama ER Completo

```mermaid
erDiagram
    User ||--o{ Address : "possui"
    User ||--o{ Order : "realiza"
    User ||--o{ Review : "escreve"
    User ||--o{ WhatsAppConversation : "conversa"
    User }|--|| Role : "tem"

    Category ||--o{ Product : "agrupa"

    Product ||--o{ ProductImage : "tem"
    Product ||--o{ ProductVersion : "tem variações"
    Product ||--o{ Review : "recebe"

    Address ||--o{ Order : "entrega"
    Order ||--o{ OrderItem : "contém"
    Order }|--|| OrderStatus : "está em"
    Order }|--|| PaymentStatus : "pagamento"
    Order }|--|| OrderSource : "origem"
    Order }|--|| PaymentMethod : "pago via"
    Order }|--|| ShippingMethod : "enviado por"

    OrderItem }|--|| Product : "refere-se"
    OrderItem }|--|| ProductVersion : "variação"

    Coupon }|--|| CouponType : "tipo"

    Setting }|--|| Category : "agrupa config"

    User {
        string id PK
        string name
        string whatsapp UK
        string email UK
        string cpfCnpj UK
        string passwordHash
        Role role
        datetime createdAt
        datetime updatedAt
    }

    Address {
        string id PK
        string userId FK
        string cep
        string street
        string number
        string complement
        string district
        string city
        string state
        boolean isDefault
        datetime createdAt
    }

    Category {
        string id PK
        string slug UK
        string name
        string description
        string icon
        string color
        int order
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Product {
        string id PK
        string slug UK
        string sku UK
        string name
        text description
        string shortDescription
        string brand
        string categoryId FK
        boolean isEco
        boolean isFeatured
        boolean isTop
        boolean isNew
        boolean active
        float rating
        int reviewCount
        string_array highlights
        datetime createdAt
        datetime updatedAt
    }

    ProductImage {
        string id PK
        string productId FK
        string url
        string alt
        int order
        boolean isPrimary
    }

    ProductVersion {
        string id PK
        string productId FK
        string sku UK
        string label
        decimal price
        decimal originalPrice
        int stock
        int weight
        int height
        int width
        int length
        string barcode
        boolean active
    }

    Order {
        string id PK
        string number UK
        string userId FK
        string guestEmail
        string guestWhatsapp
        string addressId FK
        decimal subtotal
        decimal shipping
        decimal discount
        decimal total
        OrderStatus status
        PaymentStatus paymentStatus
        OrderSource source
        string paymentId
        PaymentMethod paymentMethod
        string tracking
        ShippingMethod shippingMethod
        string notes
        datetime paidAt
        datetime shippedAt
        datetime deliveredAt
        datetime cancelledAt
        datetime createdAt
        datetime updatedAt
    }

    OrderItem {
        string id PK
        string orderId FK
        string productId
        string productName
        string versionId
        string versionLabel
        string sku
        decimal price
        int qty
        decimal total
    }

    Coupon {
        string id PK
        string code UK
        string type
        float discount
        float minOrder
        int maxUses
        int usedCount
        datetime expiresAt
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Review {
        string id PK
        string productId FK
        string userId FK
        int rating
        string title
        string comment
        boolean approved
        datetime createdAt
    }

    WhatsAppConversation {
        string id PK
        string phone
        string customerName
        json messages
        json context
        boolean resolved
        boolean humanTakeover
        datetime lastMessageAt
        datetime createdAt
    }

    Newsletter {
        string id PK
        string email UK
        boolean active
        datetime createdAt
    }

    Setting {
        string id PK
        string key UK
        string value
        string category
        string label
        string type
        datetime createdAt
        datetime updatedAt
    }
```

---

## Diagrama Simplificado (foco em negócio)

```mermaid
flowchart LR
    USER[👤 Usuário]
    CAT[📁 Categoria]
    PROD[🧴 Produto]
    VER[📦 Versão]
    ORD[🛒 Pedido]
    ITEM[📋 Item]
    ADD[📍 Endereço]
    COUP[🎟️ Cupom]
    REV[⭐ Review]
    WPP[💬 Conversa WA]

    USER -->|1:N| ADD
    USER -->|1:N| ORD
    USER -->|1:N| REV
    USER -.->|1:N| WPP

    CAT -->|1:N| PROD
    PROD -->|1:N| VER
    PROD -->|1:N| REV

    ORD -->|N:1| ADD
    ORD -->|1:N| ITEM
    ITEM -->|N:1| VER
    ITEM -.->|snapshot| PROD

    ORD -.->|usa| COUP

    style USER fill:#9333ea,color:#fff
    style CAT fill:#f59e0b,color:#fff
    style PROD fill:#10b981,color:#fff
    style VER fill:#06b6d4,color:#fff
    style ORD fill:#ec4899,color:#fff
    style ITEM fill:#f43f5e,color:#fff
    style ADD fill:#8b5cf6,color:#fff
    style COUP fill:#eab308,color:#000
    style REV fill:#facc15,color:#000
    style WPP fill:#22c55e,color:#fff
```

---

## Fluxo de Dados: Criação de Pedido

```mermaid
sequenceDiagram
    participant C as Cliente
    participant API as API /orders/create
    participant DB as PostgreSQL
    participant EVO as Evolution API
    participant ADM as Admin (WhatsApp)

    C->>API: POST /orders/create {items, address, payment}
    API->>DB: SELECT Product + ProductVersion (validar estoque)
    API->>DB: Buscar/Criar User (por WhatsApp)
    API->>DB: Criar Order (PENDING)
    API->>DB: Criar OrderItems (snapshot)
    API->>DB: Decrementar stock
    API->>EVO: Enviar notificação cliente (pedido criado)
    API->>EVO: Enviar notificação admin (novo pedido)
    EVO->>ADM: 📲 WhatsApp "novo pedido #BKR-..."
    API-->>C: 201 {orderId, number}
```

---

## Fluxo de Dados: Checkout Completo

```mermaid
sequenceDiagram
    participant C as Cliente
    participant W as Web (Next.js)
    participant DB as PostgreSQL
    participant VC as ViaCEP
    participant AI as OpenAI (IA)

    C->>W: 1. Digita WhatsApp
    W->>DB: Buscar User por WhatsApp
    alt Cliente recorrente
        DB-->>W: User + Addresses
        W-->>C: Pré-preenche dados
    else Novo cliente
        W->>DB: Criar User (lead)
        W-->>C: Continuar checkout
    end

    C->>W: 2. Digita CEP
    W->>VC: GET /{cep}
    VC-->>W: {logradouro, bairro, cidade, uf}
    W-->>C: Auto-preenche endereço

    C->>W: 3. Confirma itens
    W->>DB: Buscar produtos + versões
    W->>W: Calcular frete (por peso/CEP)
    W-->>C: Mostra opções (PAC/SEDEX/Grátis)

    C->>W: 4. Escolhe pagamento
    W->>DB: Validar cupom (se houver)
    W->>DB: Criar Order (PENDING)
    W-->>C: Mostra QR PIX / form cartão
    Note over C,W: ⚠️ Pagamento ainda é SIMULADO<br/>(Mercado Pago real = Sprint pendente)
```

---

## Cardinalidades Resumidas

| De | Para | Tipo | Descrição |
|----|------|------|-----------|
| User | Address | 1:N | Um usuário tem vários endereços |
| User | Order | 1:N | Um usuário tem vários pedidos |
| User | Review | 1:N | Um usuário escreve várias reviews |
| Category | Product | 1:N | Uma categoria tem vários produtos |
| Product | ProductImage | 1:N | Um produto tem várias imagens |
| Product | ProductVersion | 1:N | Um produto tem várias versões (tamanho, etc) |
| Product | Review | 1:N | Um produto tem várias reviews |
| Address | Order | 1:N | Um endereço é usado em vários pedidos |
| Order | OrderItem | 1:N | Um pedido tem vários itens |
| OrderItem | ProductVersion | N:1 | Cada item refere a uma versão |
| OrderItem | Product | N:1 (snapshot) | Refere ao produto (mas salva nome) |

---

## Enums (resumo visual)

```mermaid
graph TB
    subgraph Role
        R1[CUSTOMER]
        R2[ADMIN]
        R3[SUPER_ADMIN]
    end

    subgraph OrderStatus
        OS1[PENDING]
        OS2[PAID]
        OS3[PROCESSING]
        OS4[SHIPPED]
        OS5[DELIVERED]
        OS6[CANCELLED]
        OS7[REFUNDED]
    end

    subgraph PaymentStatus
        PS1[PENDING]
        PS2[PAID]
        PS3[FAILED]
        PS4[REFUNDED]
    end

    subgraph PaymentMethod
        PM1[pix]
        PM2[credit_card]
        PM3[boleto]
    end

    subgraph ShippingMethod
        SM1[free]
        SM2[pac]
        SM3[sedex]
    end

    subgraph OrderSource
        ORC1[SITE]
        ORC2[WHATSAPP]
        ORC3[ADMIN]
    end

    style R1 fill:#10b981
    style R2 fill:#f59e0b
    style R3 fill:#ef4444
    style OS1 fill:#fbbf24
    style OS2 fill:#34d399
    style OS3 fill:#60a5fa
    style OS4 fill:#a78bfa
    style OS5 fill:#22c55e
    style OS6 fill:#f87171
    style OS7 fill:#9ca3af
```

---

## Índices Estratégicos

| Tabela | Índice | Motivo |
|--------|--------|--------|
| `User` | `whatsapp` (unique) | Login OTP e busca de cliente |
| `Product` | `slug` (unique) | URL pública |
| `Product` | `categoryId` | Filtro por categoria |
| `Product` | `isTop`, `isFeatured` | Vitrine / home |
| `Order` | `number` (unique) | Rastreamento público |
| `Order` | `userId` | "Meus pedidos" |
| `Order` | `status` | Painel admin (filtros) |
| `Order` | `createdAt` | Relatórios por período |
| `OrderItem` | `orderId` | Join com pedido |
| `ProductVersion` | `sku` (unique) | Integração com estoque |
| `Review` | `(productId, userId)` (unique) | 1 review por usuário/produto |
| `WhatsAppConversation` | `phone` | Buscar histórico do cliente |
| `WhatsAppConversation` | `lastMessageAt` | Dashboard conversas |
| `Setting` | `key` (unique) | Lookup de config |

---

**Última atualização:** 08/08/2026
