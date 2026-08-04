# 🏗️ Arquitetura Técnica — E-commerce Becker

> **Status:** Plano de execução aguardando aprovação
> **Data:** 04/08/2026
> **Versão:** 1.0

---

## 🎯 Visão Geral

Construir um **e-commerce PWA (Progressive Web App)** moderno para a Becker com:
- Vitrine + checkout minimalista + painel admin
- Integração WhatsApp com agente de IA
- Foco em performance, SEO e experiência de compra

---

## 🧰 Stack Escolhida

### **Frontend (Aplicação principal)**

| Tecnologia | Versão | Por quê |
|---|---|---|
| **Next.js 14** (App Router) | 14.x | SSR/ISR → SEO forte + performance. Ecossistema gigante. |
| **TypeScript** | 5.x | Type safety, menos bugs, melhor DX |
| **Tailwind CSS** | 3.4 | Velocidade de desenvolvimento, design consistente |
| **shadcn/ui** | latest | Componentes acessíveis, customizáveis, sem vendor lock |
| **Framer Motion** | 11 | Animações sutis que dão sensação premium |
| **Zustand** | 4.x | Estado global (carrinho, UI) sem complexidade do Redux |
| **React Hook Form** | 7.x | Formulários performáticos (checkout, admin) |
| **Zod** | 3.x | Validação de dados (frontend + backend) |

### **PWA (Webapp instalável)**

| Tecnologia | Função |
|---|---|
| **next-pwa** | Manifesto + service worker + offline |
| **Workbox** | Estratégias avançadas de cache |
| **Web Push API** | Notificações de status de pedido |

### **Backend**

| Tecnologia | Por quê |
|---|---|
| **Next.js API Routes** | Mesmo runtime do front, deploy unificado |
| **tRPC** | Type-safe end-to-end (sem precisar de REST/REST docs) |
| **Prisma ORM** | Migrações fáceis, type-safe, suporta PostgreSQL |
| **NextAuth.js v5** | Auth social (Google) + OTP WhatsApp |

### **Banco de Dados**

| Opção | Custo | Quando usar |
|---|---|---|
| **PostgreSQL direto** (sua VPS) | Já tem | **Recomendado** (controle total) |
| **Supabase (PostgreSQL)** | Free até 500MB | Alternativa se quiser Auth/Storage/Real-time gerenciados |
| **Neon** | Free até 512MB | Alternativa serverless (mais "limpo") |
| **PlanetScale** | Free até 1GB | Mais robusto mas só MySQL |

**Escolha: PostgreSQL direto na VPS do cliente** — controle total, sem custo adicional, sem dependência de terceiros.

### **Pagamentos**

| Provider | Por quê |
|---|---|
| **Mercado Pago** SDK oficial | Pix nativo, split, webhooks, sandbox fácil, ~4,99% taxa |

### **Logística / Frete**

| Provider | Por quê |
|---|---|
| **Melhor Envio** | Múltiplas transportadoras, sandbox, cálculo automático |
| *Fallback:* Correios direto | Mais simples, sem dependência |

### **WhatsApp**

| Provider | Custo | Observação |
|---|---|---|
| **Evolution API** | Free (self-hosted) | **Recomendado** (já está rodando na VPS do cliente) |
| *Alternativa:* **Z-API** | ~R$ 100-300/mês | BR-friendly, fácil setup, multi-atendente |
| *Alternativa:* **Twilio** | Mais caro | Mais robusto, documentação melhor |

**Escolha: Evolution API na VPS do cliente** — sem custo mensal, open source, controle total, suporte a multi-atendente.

### **IA do Agente WhatsApp**

| Provider | Modelo | Custo |
|---|---|---|
| **OpenAI** | GPT-4o-mini | ~R$ 0,15/1k tokens |
| *Alternativa:* **Google Gemini** | Flash 1.5 | Tier grátis generoso |
| *Alternativa:* **Anthropic** | Claude Haiku | Barato e inteligente |

**Escolha inicial: OpenAI GPT-4o-mini** — qualidade e custo equilibrados.

### **Hospedagem & Deploy**

| Serviço | Função | Custo estimado |
|---|---|---|
| **Vercel** (Pro) | Frontend + Serverless | R$ 100/mês |
| **PostgreSQL** (VPS do cliente) | Banco de dados | Já tem |
| **Evolution API** (VPS do cliente) | WhatsApp | Já tem |
| **Cloudinary** | CDN de imagens | Free até 25GB |
| **Resend** | E-mail transacional | Free até 100/dia |
| **Sentry** | Error tracking | Free até 5k eventos |
| **UptimeRobot** | Monitoramento | Free |
| **Total fixo** | | **~R$ 100/mês** |

### **DevOps**

| Ferramenta | Uso |
|---|---|
| **GitHub** | Repo (que tu já criou!) |
| **GitHub Actions** | CI/CD (lint, test, build, deploy) |
| **Turborepo** | Monorepo (apps + packages compartilhados) |
| **pnpm** | Package manager rápido |
| **ESLint + Prettier** | Padronização de código |
| **Husky** | Pre-commit hooks |

---

## 📁 Estrutura de Pastas (Monorepo com Turborepo)

```
ecommerce-becker/
├── apps/
│   ├── web/                    # Loja Next.js (vitrine + checkout + conta)
│   │   ├── app/
│   │   │   ├── (loja)/         # Páginas públicas
│   │   │   │   ├── page.tsx
│   │   │   │   ├── categoria/[slug]/
│   │   │   │   ├── produto/[slug]/
│   │   │   │   ├── busca/
│   │   │   │   └── carrinho/
│   │   │   ├── (checkout)/
│   │   │   │   └── finalizar/
│   │   │   ├── (conta)/
│   │   │   ├── api/            # API Routes
│   │   │   │   ├── trpc/
│   │   │   │   ├── webhooks/   # Mercado Pago
│   │   │   │   └── auth/
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── public/
│   │   ├── components/
│   │   └── next.config.js
│   │
│   └── admin/                  # Painel admin (Next.js separado)
│       ├── app/
│       │   ├── page.tsx        # Dashboard
│       │   ├── produtos/
│       │   ├── pedidos/
│       │   ├── clientes/
│       │   ├── relatorios/
│       │   └── configuracoes/
│       └── components/
│
├── packages/
│   ├── db/                     # Prisma + cliente
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       └── index.ts
│   │
│   ├── ui/                     # Componentes compartilhados
│   │   ├── src/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── ...
│   │   └── package.json
│   │
│   ├── lib/                    # Lógica de negócio compartilhada
│   │   ├── src/
│   │   │   ├── mercadopago.ts
│   │   │   ├── whatsapp.ts
│   │   │   ├── frete.ts
│   │   │   ├── ia.ts
│   │   │   ├── auth.ts
│   │   │   └── utils.ts
│   │   └── package.json
│   │
│   ├── types/                  # TypeScript types compartilhados
│   │   └── src/
│   │
│   └── config/                 # Configurações (tailwind, eslint, ts)
│       ├── tailwind/
│       ├── eslint/
│       └── tsconfig/
│
├── docs/
│   ├── ARCHITECTURE.md         # ← este arquivo
│   ├── PRD.md                  # Product Requirements
│   ├── API.md                  # Documentação da API
│   └── DEPLOY.md               # Guia de deploy
│
├── scripts/
│   ├── seed-db.ts              # Popular DB com produtos Becker
│   └── setup-supabase.sh       # Setup inicial
│
├── .github/
│   └── workflows/
│       ├── ci.yml              # Lint + Test
│       └── deploy.yml          # Deploy auto pra Vercel
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

---

## 🗄️ Modelo de Dados (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============ USERS ============
model User {
  id            String   @id @default(cuid())
  name          String
  whatsapp      String   @unique
  email         String?  @unique
  cpfCnpj       String?  @unique
  passwordHash  String?
  role          Role     @default(CUSTOMER)
  addresses     Address[]
  orders        Order[]
  reviews       Review[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Role {
  CUSTOMER
  ADMIN
  SUPER_ADMIN
}

// ============ PRODUCTS ============
model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  sku         String   @unique
  name        String
  description String   @db.Text
  shortDescription String?
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id])
  brand       String   @default("Becker")
  isEco       Boolean  @default(false)
  isFeatured  Boolean  @default(false)
  isTop       Boolean  @default(false)
  isNew       Boolean  @default(false)
  images      ProductImage[]
  versions    ProductVersion[]
  highlights  String[]
  rating      Float    @default(0)
  reviewCount Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([categoryId])
  @@index([slug])
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  alt       String?
  order     Int     @default(0)
  isPrimary Boolean @default(false)
}

model ProductVersion {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  sku       String  @unique
  label     String  // ex: "500ml Lavanda", "3L"
  price     Decimal @db.Decimal(10, 2)
  originalPrice Decimal? @db.Decimal(10, 2)
  stock     Int     @default(0)
  weight    Int?    // gramas, para cálculo de frete
  height    Int?    // mm
  width     Int?    // mm
  length    Int?    // mm
  barcode   String?

  @@index([productId])
}

// ============ CATEGORIES ============
model Category {
  id        String    @id @default(cuid())
  slug      String    @unique
  name      String
  description String?
  icon      String?
  color     String?
  order     Int       @default(0)
  products  Product[]
  active    Boolean   @default(true)
}

// ============ ADDRESSES ============
model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  cep        String
  street     String
  number     String
  complement String?
  district   String
  city       String
  state      String
  isDefault  Boolean @default(false)
  orders     Order[]
}

// ============ ORDERS ============
model Order {
  id            String      @id @default(cuid())
  number        String      @unique  // BKR-202608-000123
  userId        String?
  user          User?       @relation(fields: [userId], references: [id])
  guestEmail    String?     // para clientes sem cadastro
  guestWhatsapp String?

  items         OrderItem[]
  addressId     String?
  address       Address?    @relation(fields: [addressId], references: [id])

  subtotal      Decimal     @db.Decimal(10, 2)
  shipping      Decimal     @db.Decimal(10, 2)
  discount      Decimal     @default(0) @db.Decimal(10, 2)
  total         Decimal     @db.Decimal(10, 2)

  status        OrderStatus @default(PENDING)
  paymentStatus PaymentStatus @default(PENDING)
  source        OrderSource @default(WEBSITE)

  paymentId     String?     // ID do Mercado Pago
  paymentMethod String?     // pix, credit_card, boleto
  tracking      String?
  shippingMethod String?    // PAC, SEDEX, etc

  notes         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  paidAt        DateTime?
  shippedAt     DateTime?
  deliveredAt   DateTime?

  @@index([userId])
  @@index([number])
  @@index([status])
}

enum OrderStatus {
  PENDING        // Aguardando pagamento
  PAID           // Pago
  PROCESSING     // Em separação
  SHIPPED        // Enviado
  DELIVERED      // Entregue
  CANCELLED      // Cancelado
  REFUNDED       // Reembolsado
}

enum PaymentStatus {
  PENDING
  PAID
  FAILED
  REFUNDED
}

enum OrderSource {
  WEBSITE
  WHATSAPP
  ADMIN
  PHONE
}

model OrderItem {
  id          String  @id @default(cuid())
  orderId     String
  order       Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId   String
  productName String  // snapshot
  versionId   String
  versionLabel String // snapshot
  sku         String
  price       Decimal @db.Decimal(10, 2)
  qty         Int
  total       Decimal @db.Decimal(10, 2)
}

// ============ COUPONS ============
model Coupon {
  id          String     @id @default(cuid())
  code        String     @unique
  type        CouponType
  discount    Float      // % ou R$
  minOrder    Float      @default(0)
  maxUses     Int?
  usedCount   Int        @default(0)
  expiresAt   DateTime?
  active      Boolean    @default(true)
}

enum CouponType {
  PERCENT
  FIXED
  FREE_SHIPPING
}

// ============ REVIEWS ============
model Review {
  id        String  @id @default(cuid())
  productId String
  userId    String
  user      User    @relation(fields: [userId], references: [id])
  rating    Int     // 1-5
  comment   String?
  approved  Boolean @default(false)
  createdAt DateTime @default(now())

  @@unique([productId, userId])
}

// ============ WHATSAPP ============
model WhatsAppConversation {
  id           String   @id @default(cuid())
  phone        String
  customerName String?
  messages     Json     // array de mensagens
  context      Json?    // estado do bot
  resolved     Boolean  @default(false)
  humanTakeover Boolean @default(false)
  lastMessageAt DateTime @default(now())
  createdAt    DateTime @default(now())

  @@index([phone])
}

// ============ NEWSLETTER ============
model Newsletter {
  id        String   @id @default(cuid())
  email     String   @unique
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
}
```

---

## 🔌 Integrações

### **1. Mercado Pago (Pagamento)**

```
Fluxo:
1. Cliente escolhe produtos → /finalizar
2. Sistema gera preferência no MP via SDK
3. Cliente paga (Pix QR, Cartão, Boleto)
4. MP envia webhook → /api/webhooks/mercadopago
5. Sistema valida + atualiza pedido → PAID
6. Cliente recebe e-mail + WhatsApp
```

### **2. WhatsApp (Agente IA)**

```
Fluxo:
1. Cliente manda mensagem → Z-API webhook
2. Sistema identifica intenção (OpenAI)
3. Para "quero comprar":
   - Mostra catálogo
   - Coleta itens
   - Coleta dados (nome, CEP)
   - Gera link de pagamento
4. Para "status do pedido":
   - Busca pelo telefone
   - Retorna status + tracking
5. Para "atendimento humano":
   - Transfere para atendente (handoff)
```

### **3. Melhor Envio (Frete)**

```
Fluxo:
1. Cliente digita CEP
2. Sistema consulta API por transportadora + prazo
3. Retorna opções (PAC, SEDEX) com valor
4. Cliente escolhe → incluído no total
```

---

## 🛡️ Segurança

| Item | Implementação |
|---|---|
| **HTTPS** | Vercel (auto) + Supabase (auto) |
| **CSP** | Content Security Policy configurado |
| **SQL Injection** | Prisma (parameterized queries) |
| **XSS** | React + sanitização |
| **CSRF** | Tokens em forms + SameSite cookies |
| **Rate Limiting** | Upstash Redis ou Vercel Edge Config |
| **Dados sensíveis** | Variáveis em `.env`, nunca commitadas |
| **Webhook signatures** | Validação Mercado Pago + Z-API |
| **LGPD** | Cookie banner + opt-in + termo de uso |

---

## 📊 Performance Targets

| Métrica | Target | Como medir |
|---|---|---|
| **Lighthouse Score** | > 90 | Mobile + Desktop |
| **FCP** (First Contentful Paint) | < 1.5s | Web Vitals |
| **LCP** (Largest Contentful Paint) | < 2.5s | Web Vitals |
| **TTI** (Time to Interactive) | < 3.0s | Web Vitals |
| **CLS** (Cumulative Layout Shift) | < 0.1 | Web Vitals |
| **Bundle size** | < 200KB JS gzipped | Vercel Analytics |
| **API response** | < 300ms p95 | Sentry + custom |

---

## 🚀 Roadmap de Execução

### **Fase 0 — Setup (3-5 dias)**
- [ ] Configurar monorepo (Turborepo + pnpm)
- [ ] Criar projeto Supabase + schema + migrações
- [ ] Configurar Tailwind + shadcn/ui
- [ ] Configurar NextAuth (Google + OTP WhatsApp)
- [ ] CI/CD básico (lint + test + build)
- [ ] Seed do banco com produtos Becker

### **Fase 1 — Loja (MVP) (10-12 dias)**
- [ ] Layout base + header + footer
- [ ] Home (hero, categorias, top, banners)
- [ ] Página de categoria com filtros
- [ ] Página de produto (galeria, versões, qty)
- [ ] Carrinho (localStorage + Zustand)
- [ ] Checkout minimalista (1 página)
- [ ] Integração Mercado Pago (Pix + Cartão)
- [ ] Confirmação de pedido
- [ ] "Minha Conta" (pedidos, dados)

### **Fase 2 — Auth + Admin (5-7 dias)**
- [ ] Login OTP WhatsApp + Google
- [ ] Painel admin (dashboard + produtos + pedidos)
- [ ] CRUD de produtos (com upload de imagens)
- [ ] Gestão de pedidos + status
- [ ] Relatórios básicos (vendas, mais vendidos)

### **Fase 3 — WhatsApp + IA (5-7 dias)**
- [ ] Integração Z-API
- [ ] Agente IA (catálogo, pedido, status)
- [ ] Handoff para humano
- [ ] Dashboard de conversas

### **Fase 4 — Polimento + Deploy (3-5 dias)**
- [ ] PWA configurado
- [ ] SEO (meta tags, sitemap, robots)
- [ ] Analytics (Google Analytics 4 + Vercel)
- [ ] Error tracking (Sentry)
- [ ] Testes E2E (Playwright)
- [ ] Deploy em produção

**Total estimado: 26-36 dias** (1 dev full-time, ou 2 devs em 2-3 semanas)

---

## 💰 Estimativa de Custo Mensal (Produção)

| Item | Custo |
|---|---|
| Vercel Pro | R$ 100 |
| PostgreSQL (VPS) | Já tem |
| Evolution API (VPS) | Já tem |
| OpenAI API (IA) | ~R$ 100 (depende do volume) |
| Domínio .com.br | R$ 50/ano |
| Cloudinary | Free (até 25GB) |
| Resend | Free (até 100/dia) |
| Sentry | Free |
| **Total fixo** | **~R$ 200/mês** |
| **Variável** (taxa MP) | **4,99% por venda** |
| **Variável** (OpenAI) | **~R$ 0,15 por 1k tokens** |

**Exemplo:** com R$ 30k de GMV/mês:
- Custos fixos: R$ 200
- Taxa MP (4,99%): R$ 1.497
- OpenAI (~500k tokens): R$ 75
- **Total: R$ 1.772** (~5,9% do GMV)

**Comparado ao plano original (com Z-API + Supabase): economia de ~R$ 1.725/mês** 🎉

---

## 🎯 Próximos Passos Imediatos

1. ✅ **Tu aprova a stack** ← você está aqui
2. ⏳ Configurar acesso ao repo (token GitHub ou deixar público)
3. 🚀 Iniciar Fase 0 (setup do monorepo)
4. 📅 Apresentar cronograma detalhado com marcos

---

**Dúvidas? Quer que eu ajuste alguma coisa na stack ou arquitetura?**
