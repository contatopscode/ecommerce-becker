# 📋 PLANO DE DESENVOLVIMENTO — Becker E-commerce

**Status:** 🟢 Em produção | **URL:** https://becker.pscode.ia.br | **Última atualização:** 08/08/2026

> ⚠️ **Versão 2.0** — Atualizado após auditoria técnica (Fase 0).
> Mudanças: removido "Melhor Envio" (Sprint 11 — vai ser motoboy via WhatsApp), removido "App mobile nativo" (Sprint 15 — sem prioridade), removido código Telegram morto, removido app `apps/admin/` duplicado.

---

## 🎯 Visão Geral

Plataforma de e-commerce completa para a **Becker** (produtos de limpeza, 40 anos no mercado) com:
- Loja virtual (PWA Next.js 15) auto-hospedada via Easypanel
- Atendimento via WhatsApp com IA (Evolution API)
- Notificações internas para a equipe
- Painel administrativo completo
- Banco de dados PostgreSQL 17 no VPS do cliente

---

## ✅ JÁ FEITO (Pronto / Em Produção)

### 🏗️ Infraestrutura
- [x] **Monorepo** com Turborepo + pnpm 9.15.0
- [x] **Stack:** Next.js 15.1.4 + TypeScript + Tailwind + Zustand + Prisma + PostgreSQL 17
- [x] **PostgreSQL no VPS** `213.199.32.229:5432/becker`
- [x] **Self-hosting Easypanel** com Dockerfile (Node 20 Debian slim + libssl + Prisma)
- [x] **Domínio** `https://becker.pscode.ia.br` configurado
- [x] **GitHub** público: `https://github.com/contatopscode/ecommerce-becker`
- [x] **~50 commits** deployados, branch `main`
- [x] **CI via GitHub Actions** (lint + type-check)
- [x] **Deploy automático** via Easypanel (push na main)
- [x] **Caddy** com SSL automático (Let's Encrypt)

### 🛍️ Loja Virtual (Cliente Final)
- [x] **Catálogo** com 23 produtos ativos, 9 categorias, 40 versões (preço/peso/estoque)
- [x] **Página de categoria** com listagem + filtros
- [x] **Página de produto** com galeria, descrição, versões
- [x] **Busca** com autocomplete + filtros (categoria, preço, marca, eco, ordenação)
- [x] **Carrinho** persistente (Zustand + localStorage)
- [x] **Wishlist** (botão ❤ em cada produto + página `/favoritos`)
- [x] **Páginas institucionais:** `/sobre`, `/empresas`, `/ofertas`, `/atendimento`
- [x] **Footer** com links, redes sociais, contato
- [x] **PWA** configurado (manifest + service worker)
- [x] **Imagens reais** dos produtos Becker

### 🛒 Checkout (4 Steps)
- [x] **Step 1 — Identificação:** WhatsApp auto-detecta cliente recorrente + pré-cadastra
- [x] **Step 2 — Endereço:** CEP auto via ViaCEP + não pula pra clientes recorrentes
- [x] **Step 3 — Frete:** Cálculo por peso configurável (PAC / SEDEX / Grátis)
- [x] **Step 4 — Pagamento:** PIX / Cartão / Boleto simulado com QR code visual
- [x] **Cupom de 15% OFF** na primeira compra (BECKER15)
- [x] **Salvar progresso** step-by-step (não perde dados se fechar)
- [x] **Pré-cadastro automático** (lead capture) quando WhatsApp novo digitado

### 📦 Pedidos
- [x] **Criação de pedido** com status `PENDING` + `paymentStatus PENDING`
- [x] **Rastreamento público** via `/pedido/[number]` com timeline visual
- [x] **Mudança de status** (PENDING → PAID → PROCESSING → SHIPPED → DELIVERED)
- [x] **Soft delete** de produtos (preserva histórico de pedidos)
- [x] **Snapshots** de itens (nome, preço, versão salvos no pedido)

### 💬 WhatsApp + IA
- [x] **Evolution API** configurada (Vigilia instance)
- [x] **Webhook** recebe mensagens do cliente
- [x] **IA** (OpenAI GPT-4o-mini) responde sobre produtos, pedidos, frete
- [x] **7 templates** de notificação formatados pro cliente
- [x] **Detecção de intent** local (regex) antes de chamar OpenAI (economia de tokens)
- [x] **Contexto por cliente** (WhatsAppConversation no DB)
- [x] **Código Telegram morto removido** (substituído por WhatsApp Evolution)

### 🔐 Autenticação
- [x] **OTP via WhatsApp** (código de 6 dígitos, hash sha256, expira em 10min)
- [x] **Sessão httpOnly** (cookie seguro, 30 dias)
- [x] **Promoção de admin** pelo painel (sem mexer no DB)
- [x] **Auto-cadastro** quando cliente digita WhatsApp no checkout

### 👨‍💼 Painel Admin
- [x] **Dashboard** com métricas (pedidos, receita, leads)
- [x] **Pedidos** — lista + detalhe + mudança de status (manda WhatsApp automático)
- [x] **Produtos** — CRUD completo (criar/editar/deletar soft) com modal
- [x] **Leads** — lista de WhatsApps pré-cadastrados
- [x] **Clientes** — lista + role (promover/rebaixar admin)
- [x] **Conversas** — histórico de chats com a IA
- [x] **Configurações** — 4 abas (Frete, Promoções, Integrações, Geral)

### 📲 Notificações Internas (Admin)
- [x] **WhatsApp Evolution** mandando resumo pro admin
- [x] **6 templates admin:** novo pedido, pagamento, envio, entrega, cancelamento, lead
- [x] **Validação automática** de número (Evolution não aceita o 9 depois do DDD)
- [x] **Botão de teste** no Admin Config
- [x] **Fallback pra env vars** (não precisa configurar se já tá na VPS)

### 📚 Documentação
- [x] **PRD** completo (`docs/PRD.md`)
- [x] **Arquitetura** técnica (`docs/ARCHITECTURE.md`)
- [x] **API** documentada (`docs/API.md`)
- [x] **Dicionário de Dados** (`docs/DICIONARIO_DADOS.md`)
- [x] **Diagrama Relacional** (`docs/DIAGRAMA_RELACIONAL.md`)
- [x] **Histórias de Usuário** (`docs/HUs/`) — 43 HUs no padrão Blue Technology
- [x] **CHANGELOG** (`docs/CHANGELOG.md`)
- [x] **CONTRIBUTING** (`docs/CONTRIBUTING.md`)

### 📊 Números Atuais
- **23 produtos** ativos
- **9 categorias**
- **40 versões** de produtos (preço/peso/estoque)
- **~250 usuários** cadastrados
- **~260 pedidos** no sistema
- **3 cupons** ativos

---

## 🟢 EM PRODUÇÃO — Notas de Manutenção

### Limpeza Recente (Fase 0 — 08/08/2026)

- ✅ Removido código Telegram morto (6 rotas + lib)
- ✅ Removido `apps/admin/` duplicado (admin real está em `apps/web/src/app/admin/`)
- ✅ Atualizado `docker-compose.yml` e `Caddyfile`
- ✅ Documentação completa criada (PRD, API, Dicionário, Diagrama, HUs)

---

## 🔴 A FAZER (Pendente)

### 🚀 Sprint 6 — Pagamento Real (Mercado Pago)
> ✅ **Decisão:** Mercado Pago (definido 08/08/2026)
> ✅ **Modo:** Sandbox primeiro, migração pra produção depois
> ✅ **Config:** Aba "Pagamentos" em /admin/configuracoes (credenciais no DB)

- [x] SDK Mercado Pago (`mercadopago` v2.x)
- [x] `lib/payments/mercadopago.ts` (wrapper)
- [x] `lib/payments/index.ts` (fachada)
- [x] Modificar `/api/orders/create` pra criar pagamento PIX
- [x] Webhook `/api/webhooks/mercadopago`
- [x] Polling `/api/orders/status/[orderId]`
- [x] UI `/checkout/pagamento/[orderId]` com QR Code real
- [x] Aba "Pagamentos" em `/admin/configuracoes` com botão "Testar conexão"
- [ ] Estorno / refund
- [ ] Migração produção (após validar em sandbox)
- [ ] **Estimativa:** 1-2 semanas (validar sandbox + produção)

### 🔒 Sprint 7 — LGPD + Segurança
- [x] Banner de consentimento de cookies (LGPD)
- [x] Política de privacidade (`/privacidade`)
- [x] Termos de uso (`/termos`)
- [x] 2FA para admin (TOTP com otplib) — `/admin/seguranca`
- [x] Backup automático do Postgres (script + API + cron externo)
- [x] Rate limiting nas APIs críticas (OTP, orders, cep, search)
- [ ] Logs de auditoria (próxima sprint)
- [ ] **Estimativa:** 1-2 semanas (Fase 1 completa)

### 🧾 Sprint 8 — Nota Fiscal
- [ ] Decidir provedor (Focus NFe, eNotas, Tiny)
- [ ] Emissão automática após pagamento
- [ ] Envio por e-mail
- [ ] Salvar XML no storage
- [ ] Cancelamento / carta de correção
- [ ] **Estimativa:** 1 semana

### 📈 Sprint 9 — Marketing & Analytics
- [ ] Google Analytics 4 + Tag Manager
- [ ] Facebook Pixel
- [ ] Integração com Google Ads
- [ ] Cupom por primeira compra automático (sem precisar digitar)
- [ ] Email marketing (cart abandonado, pós-compra)
- [ ] Push notifications (PWA)
- [ ] **Estimativa:** 2 semanas

### 🔍 Sprint 10 — SEO & Performance
- [ ] Meta tags dinâmicas (OpenGraph, Twitter Cards)
- [ ] Sitemap.xml automático
- [ ] robots.txt
- [ ] Schema.org (Product, BreadcrumbList, Review)
- [ ] Lazy loading de imagens + WebP
- [ ] Lighthouse score 90+ em todas as páginas
- [ ] **Estimativa:** 1 semana

### 💬 Sprint 11 — Chat & Suporte
- [ ] Chat ao vivo no site (widget)
- [ ] Transferência chat → humano (handoff)
- [ ] Múltiplos atendentes
- [ ] Métricas de atendimento (tempo, satisfação)
- [ ] **Estimativa:** 2 semanas

### 🎨 Sprint 12 — UI/UX Improvements
- [ ] Modo escuro
- [ ] Comparador de produtos
- [ ] Reviews e avaliações (com moderação)
- [ ] Wishlist compartilhável
- [ ] Filtros avançados (fragância, tipo, marca)
- [ ] **Estimativa:** 1-2 semanas

### 🏢 Sprint 13 — B2B (Empresas)
- [ ] Cadastro de empresa (CNPJ)
- [ ] Catálogo diferenciado com preços por volume
- [ ] Aprovação de pedido por gestor
- [ ] Múltiplos endereços de entrega
- [ ] Cotação automática
- [ ] **Estimativa:** 2 semanas

### 🛠️ Sprint 14 — Operacional
- [ ] Painel de controle do sistema (uptime, logs, métricas)
- [ ] CI/CD completo (GitHub Actions deploy)
- [ ] Testes E2E (Playwright)
- [ ] QA suite automatizada
- [ ] Monitoramento de erros (Sentry)
- [ ] Documentação OpenAPI
- [ ] **Estimativa:** 2 semanas

---

## ❌ REMOVIDO DO BACKLOG

- ~~Sprint — Integração Melhor Envio~~ → **Entrega será via motoboy parceiro (WhatsApp)**
- ~~Sprint — App mobile nativo (iOS/Android)~~ → **Sem prioridade — foco em PWA**

---

## 💡 Melhorias Contínuas (Backlog)

### Performance
- [ ] CDN para imagens (Cloudflare / BunnyCDN)
- [ ] Edge functions
- [ ] Redis para cache de queries
- [ ] Otimizar Prisma queries (select específico)
- [ ] Compressão Brotli

### Conversão
- [ ] Carrinho abandonado (lembrete por WhatsApp 1h, 24h, 72h)
- [ ] One-click buy (cliente recorrente)
- [ ] Sugestões de upsell no carrinho
- [ ] Social proof (mostrar "X pessoas vendo agora")
- [ ] Exit intent popup

### Conteúdo
- [ ] Blog com SEO
- [ ] Landing pages por campanha
- [ ] Vídeos de produto
- [ ] Depoimentos de clientes
- [ ] Guia de uso (como usar cada produto)

### Admin
- [ ] Relatórios avançados (vendas por período, produto top, etc)
- [ ] Exportação Excel/CSV
- [ ] Gestão de estoque com alerta de mínimo
- [ ] Importação em massa de produtos
- [ ] Histórico de mudanças (audit log)

---

## 🎯 Roadmap Sugerido (Próximos 3 meses)

| Mês | Sprint | Foco | Entregas |
|-----|--------|------|----------|
| **Mês 1** | 6 | Pagamento Real (após decidir gateway) | MP/outro integrado, status auto |
| **Mês 1** | 7 | LGPD + Segurança | Cookies, 2FA, backup, rate limit |
| **Mês 2** | 8 | Nota Fiscal | NF emitida automaticamente |
| **Mês 2** | 9 | Marketing | GA4, Pixel, cupom auto |
| **Mês 3** | 10 | SEO | Lighthouse 90+ |
| **Mês 3** | 14 | Operacional | QA suite, CI/CD, Sentry |

**Total estimado:** ~12 semanas (3 meses) com 1 dev full-time

---

## 📊 Métricas do Projeto

- **Total de commits:** ~50
- **Linhas de código:** ~12.000 (estimativa)
- **Rotas da loja:** 17
- **Rotas admin:** 7
- **Endpoints API:** ~22
- **Modelos Prisma:** 13
- **Tabelas DB:** 13
- **Templates WhatsApp:** 7 cliente + 6 admin
- **HUs documentadas:** 43
- **Documentos em docs/:** 9

---

## 🛠️ Stack Técnico

### Frontend
- **Framework:** Next.js 15.1.4 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Estado:** Zustand (carrinho, wishlist)
- **UI:** Componentes próprios

### Backend
- **API:** Next.js API Routes
- **ORM:** Prisma
- **Banco:** PostgreSQL 17
- **Auth:** Custom (OTP via WhatsApp)
- **IA:** OpenAI (gpt-4o-mini)

### Infraestrutura
- **Hosting:** Easypanel (Docker)
- **Docker:** Node 20 Debian slim + libssl
- **WhatsApp:** Evolution API (Vigilia)
- **Repositório:** GitHub (público)
- **CI/CD:** GitHub Actions (CI) + Easypanel (CD)

---

## 🔗 Links Úteis

- **Site:** https://becker.pscode.ia.br
- **Admin:** https://becker.pscode.ia.br/admin
- **GitHub:** https://github.com/contatopscode/ecommerce-becker
- **Evolution API:** https://evolution-evolution-api.vcli1q.easypanel.host

---

## 📝 Notas Técnicas

### Decisões Arquiteturais
1. **Server Actions** ao invés de tRPC (mais simples, mesma type-safety)
2. **Custom auth** ao invés de NextAuth (mais simples pro caso de OTP WhatsApp)
3. **OTP hashed** em httpOnly cookie (não no DB)
4. **Webhook Evolution** detecta intent local (regex) antes de chamar OpenAI
5. **Pré-cadastro automático** no checkout (lead capture)
6. **Save progress** step-by-step (UX melhor)
7. **Soft delete** de produtos (preserva histórico)
8. **WhatsApp Evolution** pra notificações internas (substituiu Telegram)
9. **Validação de telefone** obrigatória (Evolution não aceita o 9)
10. **TypeScript strict relaxado** (warnings não bloqueiam)
11. **Admin em app único** (`apps/web/src/app/admin/`) — sem `apps/admin/` separado

### Lições Aprendidas
1. **WhatsApp Business API** não aceita o 9 depois do DDD — normalizar sempre
2. **Telegram** pode ser bloqueado/sem acesso — não usar como canal crítico
3. **Prisma Client** precisa ser regenerado após mudança de schema
4. **Next.js 15** params são Promises (precisa `await`)
5. **Soft delete** melhor que hard delete pra preservar histórico
6. **Testar em produção** é arriscado — staging antes seria ideal

### Conhecidos (limitações atuais)
- ⚠️ Pagamento é simulado (Sprint 6 trará gateway real)
- ❌ NF não é emitida (Sprint 8)
- ⚠️ Frete é calculado por peso (não consulta transportadora)
- ❌ Sem CDN pra imagens
- ❌ Sem modo escuro
- ❌ Sem reviews de clientes
- ❌ Sem chat humano (só IA)
- ❌ Sem QA suite automatizada (Sprint 14)

---

**Última atualização:** 08/08/2026 (Fase 0 — Higienização + Documentação)
**Versão do documento:** 2.0
**Status do projeto:** 🟢 MVP em produção, expansão planejada
