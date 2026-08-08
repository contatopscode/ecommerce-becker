# Changelog

Todas as mudanças notáveis neste projeto serão documentadas aqui.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto segue [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Não publicado]

### Adicionado
- Documentação completa em `docs/` (PRD, API, Dicionário de Dados, Diagrama Relacional)
- Histórias de Usuário (HUs) organizadas por sprint
- Guia de contribuição (CONTRIBUTING.md)

### Modificado
- Limpeza de código Telegram morto (substituído por Evolution API)
- Remoção do app `apps/admin/` duplicado (admin real está em `apps/web/src/app/admin/`)
- Atualização do `docker-compose.yml` e `Caddyfile` para refletir arquitetura atual

---

## [1.0.0] - 2026-08-08 — MVP em Produção

### Adicionado
- **Loja virtual (PWA Next.js 15)** auto-hospedada em Easypanel
  - 23 produtos ativos, 9 categorias, 40 versões
  - Catálogo com filtros (categoria, preço, marca, eco)
  - Página de produto com galeria, descrição, versões
  - Busca com autocomplete
  - Carrinho persistente (Zustand + localStorage)
  - Wishlist (favoritos)
  - Páginas institucionais (sobre, empresas, ofertas, atendimento)
  - PWA configurado (manifest + service worker)

- **Checkout 4 steps**
  - Identificação via WhatsApp (detecta cliente recorrente)
  - Endereço com auto-preenchimento ViaCEP
  - Cálculo de frete por peso (PAC / SEDEX / Grátis)
  - Pagamento simulado (PIX / Cartão / Boleto)
  - Salvar progresso step-by-step
  - Pré-cadastro automático (lead capture)

- **Pedidos**
  - Criação com status PENDING
  - Rastreamento público com timeline visual
  - Mudança de status (PENDING → PAID → PROCESSING → SHIPPED → DELIVERED)
  - Soft delete de produtos

- **WhatsApp + IA (Evolution API)**
  - Webhook recebe mensagens do cliente
  - OpenAI GPT-4o-mini responde sobre produtos, pedidos, frete
  - 7 templates de notificação para cliente
  - Detecção de intent local (regex) antes de chamar OpenAI
  - Contexto por cliente persistido em DB

- **Autenticação**
  - OTP via WhatsApp (código 6 dígitos, hash sha256, expira 10min)
  - Sessão httpOnly (cookie seguro, 30 dias)
  - Promoção de admin pelo painel
  - Auto-cadastro quando cliente digita WhatsApp no checkout

- **Painel Admin**
  - Dashboard com métricas
  - Pedidos (lista + detalhe + mudança de status)
  - Produtos (CRUD com soft delete)
  - Leads (WhatsApps pré-cadastrados)
  - Clientes (lista + role)
  - Conversas (histórico WhatsApp IA)
  - Configurações (Frete, Promoções, Integrações, Geral)

- **Notificações internas (Admin)**
  - WhatsApp Evolution para admin (81) 99944-1333
  - 6 templates admin (novo pedido, pagamento, envio, entrega, cancelamento, lead)

- **Qualidade**
  - TypeScript strict relaxado
  - Validações em todas as APIs
  - Logs explícitos em pontos críticos

### Infraestrutura
- Monorepo Turborepo + pnpm 9.15.0
- PostgreSQL 17 no VPS (213.199.32.229:5432/becker)
- Self-hosting via Easypanel (Docker Node 20 Debian slim)
- Domínio `https://becker.pscode.ia.br`
- Caddy para SSL automático
- GitHub Actions (CI: lint + type-check)

### Métricas
- 23 produtos ativos
- 9 categorias
- 40 versões de produtos
- 244 usuários cadastrados
- 257 pedidos no sistema
- 3 cupons ativos
- 13 modelos Prisma
- ~25 endpoints API
- 17 rotas da loja + 7 rotas admin

---

## Tipos de Mudanças

- **Adicionado** — novas funcionalidades
- **Modificado** — mudanças em funcionalidades existentes
- **Descontinuado** — funcionalidades que serão removidas em breve
- **Removido** — funcionalidades removidas
- **Corrigido** — correção de bugs
- **Segurança** — mudanças de segurança
