# Guia de Contribuição — Becker E-commerce

Obrigado por contribuir com o Becker E-commerce! Este documento cobre como rodar o projeto, padrões de código, e como submeter mudanças.

---

## 📋 Índice

1. [Stack e Pré-requisitos](#stack-e-pré-requisitos)
2. [Setup Local](#setup-local)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Padrões de Código](#padrões-de-código)
5. [Commits e Branches](#commits-e-branches)
6. [Testes](#testes)
7. [Deploy](#deploy)
8. [Fluxo de PR](#fluxo-de-pr)

---

## Stack e Pré-requisitos

- **Node.js 20+**
- **pnpm 9+** (`npm install -g pnpm`)
- **PostgreSQL 17** (local ou Docker)
- **Git**

## Setup Local

### 1. Clone o repositório

```bash
git clone https://github.com/contatopscode/ecommerce-becker.git
cd ecommerce-becker
```

### 2. Instale dependências

```bash
pnpm install
```

### 3. Configure variáveis de ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

### 4. Setup do banco

```bash
pnpm db:generate  # Gera Prisma Client
pnpm db:push      # Aplica schema ao DB
pnpm db:seed      # Popula com produtos Becker
```

### 5. Rode em dev

```bash
pnpm dev
```

Acesse:
- **Loja:** http://localhost:3000
- **Admin:** http://localhost:3000/admin

---

## Estrutura do Projeto

```
ecommerce-becker/
├── apps/
│   └── web/                      # App Next.js (loja + admin)
│       └── src/
│           ├── app/              # App Router (páginas + API)
│           ├── components/       # Componentes React
│           └── lib/              # Helpers específicos da app
│
├── packages/
│   ├── db/                       # Prisma schema + client
│   ├── lib/                      # Lógica de negócio compartilhada
│   ├── ui/                       # Componentes UI compartilhados
│   └── types/                    # TypeScript types
│
├── docs/                         # Documentação
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DICIONARIO_DADOS.md
│   ├── DIAGRAMA_RELACIONAL.md
│   ├── PLANO_BECKER.md
│   ├── CHANGELOG.md
│   └── HUs/                      # Histórias de Usuário
│
└── turbo.json                    # Configuração Turborepo
```

### Onde colocar código novo?

| Tipo | Local |
|------|-------|
| Página de loja | `apps/web/src/app/<rota>/page.tsx` |
| Página admin | `apps/web/src/app/admin/<modulo>/page.tsx` |
| API endpoint | `apps/web/src/app/api/<recurso>/route.ts` |
| Lógica de negócio | `packages/lib/src/<recurso>.ts` |
| Componente reutilizável | `packages/ui/src/<Componente>.tsx` |
| Model Prisma | `packages/db/prisma/schema.prisma` |

---

## Padrões de Código

### TypeScript

- **Strict mode** está ligado (mas com algumas regras relaxadas)
- Sempre tipar retorno de função pública
- Evitar `any` — preferir `unknown` + type guard

### Next.js 15

- Params são `Promise` (precisa `await`):
  ```ts
  export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
  }
  ```
- Server Components por padrão
- Marcar `'use client'` apenas quando precisar de estado/efeitos

### Prisma

- Sempre usar `select` específico (não `findMany` sem select)
- Soft delete: usar campo `active` em vez de deletar
- Snapshots: salvar `productName` no `OrderItem` (não confiar em relação)

### Estilização

- Tailwind CSS (utility-first)
- Variáveis CSS em `globals.css` (`--becker-purple`, `--becker-cream`, etc)
- Componentes com classes utilitárias, sem CSS modules

### Validação

- **Zod** para schemas (frontend + backend)
- Validar entrada em TODA API route
- Retornar 400 com mensagem clara em caso de erro

### Logs

- Use `console.log('[modulo] mensagem')` com prefixo
- Ex: `console.log('[orders] pedido criado', order.id)`
- Logs explícitos em pontos críticos (criação de pedido, pagamento, etc)

---

## Commits e Branches

### Convenção de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

**Tipos:**
- `feat` — nova funcionalidade
- `fix` — correção de bug
- `refactor` — refatoração sem mudança de comportamento
- `style` — formatação, ponto-e-vírgula faltando, etc
- `docs` — só documentação
- `test` — adicionar/corrigir testes
- `chore` — tarefas de build, dependências, etc

**Exemplos:**
```bash
feat(checkout): adicionar cupom de primeira compra
fix(orders): corrigir cálculo de subtotal
docs(api): documentar endpoint /api/orders
```

### Branches

- `main` — produção (deploya automaticamente)
- `feature/<nome>` — nova feature
- `fix/<nome>` — correção de bug
- `docs/<nome>` — só documentação

---

## Testes

> ⚠️ **QA suite automatizada está em construção** (Sprint 16). Por enquanto:
> - Testes manuais no fluxo de checkout
> - QA visual em produção após deploy
> - Validação manual de cada PR

### Como testar localmente antes de subir PR

1. Rode `pnpm dev`
2. Teste o fluxo de checkout completo (criar pedido)
3. Verifique mudanças no admin (`/admin`)
4. Teste a integração WhatsApp (mande mensagem pro bot)
5. Cheque o painel admin de pedidos/conversas

---

## Deploy

### Fluxo automático

O deploy é **automático via Easypanel** quando há push na `main`:

1. Você faz push
2. Easypanel detecta mudança no GitHub
3. Easypanel faz build da imagem Docker
4. Easypanel faz deploy no container
5. SSL renovado automaticamente (Caddy)

### Antes de fazer push na main

- [ ] Testou localmente?
- [ ] Build passa? (`pnpm build`)
- [ ] Lint passa? (`pnpm lint`)
- [ ] Type-check passa? (`pnpm type-check`)

### Rollback

Se algo quebrar em produção:

```bash
# No Easypanel: ir em Deployments → clicar na versão anterior → "Redeploy"
# OU via git:
git revert HEAD
git push origin main
```

---

## Fluxo de PR

1. **Crie uma branch** a partir da `main`:
   ```bash
   git checkout -b feature/nova-coisa
   ```

2. **Faça commits pequenos** com mensagens claras

3. **Teste localmente** (ver checklist acima)

4. **Push da branch:**
   ```bash
   git push origin feature/nova-coisa
   ```

5. **Abra PR** no GitHub para `main`

6. **Code review** — outro dev revisa (ou você mesmo, se for solo)

7. **Merge** — squash merge pra manter histórico limpo

---

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. Em produção, configure no Easypanel.

**Variáveis críticas:**
- `DATABASE_URL` — conexão PostgreSQL
- `EVOLUTION_API_URL` / `EVOLUTION_API_KEY` / `EVOLUTION_INSTANCE` — WhatsApp
- `OPENAI_API_KEY` — IA do bot
- `NEXTAUTH_SECRET` — sessão

**⚠️ NUNCA commite o `.env`** — já está no `.gitignore`.

---

## Dúvidas?

- Veja a [arquitetura](./ARCHITECTURE.md)
- Veja o [plano de desenvolvimento](./PLANO_BECKER.md)
- Veja as [HUs](./HUs/) para entender features planejadas

---

**Becker Indústrias © 2026**
