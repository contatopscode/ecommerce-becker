# Becker E-commerce

> E-commerce oficial da Becker com integração WhatsApp via Evolution API.

## Status
Em desenvolvimento.

## Stack
- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **PostgreSQL** (VPS do cliente) + **Prisma**
- **Mercado Pago** (pagamentos)
- **Evolution API** (VPS do cliente) + **OpenAI** (agente WhatsApp)
- **Vercel** (deploy)

## Diferenciais da infra
- 🐘 **PostgreSQL direto** (sem Supabase) — controle total
- 📱 **Evolution API self-hosted** — sem custo mensal com WhatsApp
- 🤖 **OpenAI GPT-4o-mini** — IA acessível e barata

## Estrutura (Monorepo com Turborepo)
```
becker-dev/
├── apps/
│   ├── web/          # Loja Next.js (vitrine + checkout + conta)
│   └── admin/        # Painel admin
├── packages/
│   ├── db/           # Prisma + cliente
│   ├── ui/           # Componentes compartilhados
│   ├── lib/          # MP, Evolution, IA, frete, auth
│   └── types/        # TypeScript types
├── docs/
│   ├── ARCHITECTURE.md  # Arquitetura técnica completa
│   ├── PRD.md
│   └── DEPLOY.md
└── scripts/
```

## Setup
```bash
pnpm install
cd apps/web
pnpm dev
```

## Documentação
- [Arquitetura completa](./docs/ARCHITECTURE.md)
- [PRD](./docs/PRD.md)
- [Deploy](./docs/DEPLOY.md)
