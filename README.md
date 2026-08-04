# Becker E-commerce

> E-commerce oficial da Becker com integração WhatsApp via Evolution API.

## 🧰 Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend:** Next.js API Routes + tRPC
- **Banco:** PostgreSQL (VPS) + Prisma
- **Auth:** NextAuth.js v5 (Google + OTP WhatsApp)
- **WhatsApp:** Evolution API (self-hosted) + OpenAI GPT-4o-mini
- **Pagamento:** Mercado Pago
- **Hospedagem:** Self-host na VPS (Docker)

## 📁 Estrutura

```
becker-ecommerce/
├── apps/
│   ├── web/          # Loja Next.js (vitrine + checkout + conta)
│   └── admin/        # Painel admin
├── packages/
│   ├── db/           # Prisma client + schema
│   ├── lib/          # MP, Evolution, IA, frete, auth
│   ├── ui/           # Componentes compartilhados
│   ├── types/        # TypeScript types
│   └── config/       # Configs (tailwind, eslint, ts)
├── docs/
└── scripts/
```

## 🚀 Setup

### Pré-requisitos
- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (para rodar Postgres local se precisar)

### Instalação

```bash
# Instalar dependências
pnpm install

# Copiar .env
cp .env.example .env
# Editar .env com suas credenciais

# Setup do banco (gera Prisma client + aplica schema)
pnpm db:generate
pnpm db:push

# Popular banco com produtos Becker
pnpm db:seed

# Rodar em dev
pnpm dev
```

### Acessar
- **Web (loja):** http://localhost:3000
- **Admin:** http://localhost:3001

## 📜 Scripts

| Script | O que faz |
|---|---|
| `pnpm dev` | Roda todas as apps em modo dev |
| `pnpm build` | Build de produção |
| `pnpm lint` | Roda ESLint em todos os packages |
| `pnpm type-check` | Verifica tipos TypeScript |
| `pnpm db:generate` | Gera Prisma Client |
| `pnpm db:push` | Aplica schema ao DB (sem migration) |
| `pnpm db:migrate` | Cria + aplica migration |
| `pnpm db:seed` | Popula banco com produtos Becker |
| `pnpm db:studio` | Abre Prisma Studio (GUI do DB) |

## 📦 Packages compartilhados

- **`@becker/db`** — Prisma client + schema de todas as tabelas
- **`@becker/lib`** — Funções de negócio (pagamento, WhatsApp, IA, frete, auth)
- **`@becker/ui`** — Componentes React reutilizáveis (Button, Card, Input, etc)
- **`@becker/types`** — TypeScript types compartilhados (DTOs, enums, etc)
- **`@becker/config`** — Configurações de Tailwind, ESLint, TS

## 🚀 Deploy

Veja [docs/DEPLOY.md](./docs/DEPLOY.md) para instruções completas de deploy self-hosted na VPS.

## 📚 Documentação

- [Arquitetura técnica](./docs/ARCHITECTURE.md)
- [PRD](./docs/PRD.md) (em breve)
- [Deploy guide](./docs/DEPLOY.md) (em breve)

## 🛡️ Segurança

- ❌ **NUNCA** commite o arquivo `.env`
- ❌ **NUNCA** exponha API keys em código
- ✅ Use sempre `process.env.MINHA_VAR` em código
- ✅ Em produção, use Docker secrets ou vault

## 📄 Licença

Proprietary - Becker Indústrias © 2026
