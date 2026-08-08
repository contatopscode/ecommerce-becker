---
slug: becker-ecommerce
status: rascunho
gerado_em: 2026-08-08
hus_count: 35
release: v1.0
---

# Documento de Requisitos — Becker E-commerce

## Contexto

Plataforma de e-commerce oficial da **Becker** (produtos de limpeza com 40 anos de mercado), com loja virtual (PWA Next.js), atendimento via WhatsApp com IA (Evolution API + OpenAI) e painel administrativo completo. Auto-hospedada na VPS do cliente.

## Escopo

Este documento cobre TODAS as features do MVP (Sprint 1-5, já em produção) e o backlog planejado (Sprint 6+). As HUs estão organizadas por módulo.

## Não-escopo

- App mobile nativo (iOS/Android)
- Integração com transportadoras reais (entrega via motoboy parceiro)
- Marketplace multi-vendedor
- Gateway de pagamento próprio (será integração com gateway externo)
- Chat humano ao vivo no site
- Programa de fidelidade / cashback

## HUs por Módulo

### 📦 Catálogo (Sprint 1)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU001 | Navegando pelo catálogo | Alta | ✅ Pronto | RN01-RN03 |
| HU002 | Filtrando produtos por categoria | Alta | ✅ Pronto | RN01-RN02 |
| HU003 | Visualizando detalhes do produto | Alta | ✅ Pronto | RN01-RN04 |
| HU004 | Buscando produtos | Alta | ✅ Pronto | RN01-RN03 |
| HU005 | Visualizando produtos em destaque | Média | ✅ Pronto | RN01-RN02 |
| HU006 | Marcando produtos como eco | Baixa | ✅ Pronto | RN01 |

### 🛒 Carrinho (Sprint 1)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU007 | Adicionando produto ao carrinho | Alta | ✅ Pronto | RN01-RN03 |
| HU008 | Removendo produto do carrinho | Alta | ✅ Pronto | RN01 |
| HU009 | Visualizando carrinho | Alta | ✅ Pronto | RN01-RN02 |
| HU010 | Calculando total do carrinho | Alta | ✅ Pronto | RN01-RN02 |

### ❤️ Wishlist (Sprint 2)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU011 | Adicionando produto aos favoritos | Média | ✅ Pronto | RN01-RN02 |
| HU012 | Visualizando lista de favoritos | Média | ✅ Pronto | RN01 |

### 💳 Checkout (Sprint 2)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU013 | Iniciando checkout | Alta | ✅ Pronto | RN01 |
| HU014 | Identificando-se via WhatsApp | Alta | ✅ Pronto | RN01-RN04 |
| HU015 | Preenchendo endereço de entrega | Alta | ✅ Pronto | RN01-RN03 |
| HU016 | Selecionando opção de frete | Alta | ✅ Pronto | RN01-RN03 |
| HU017 | Aplicando cupom de desconto | Média | ✅ Pronto | RN01-RN04 |
| HU018 | Salvando progresso do checkout | Média | ✅ Pronto | RN01-RN02 |
| HU019 | Pré-cadastrando novo cliente (lead) | Média | ✅ Pronto | RN01-RN03 |

### 📦 Pedidos (Sprint 2)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU020 | Criando pedido | Alta | ✅ Pronto | RN01-RN05 |
| HU021 | Rastreando pedido publicamente | Alta | ✅ Pronto | RN01-RN02 |
| HU022 | Visualizando meus pedidos | Média | ✅ Pronto | RN01 |

### 🔐 Autenticação (Sprint 3)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU023 | Autenticando via OTP WhatsApp | Alta | ✅ Pronto | RN01-RN05 |
| HU024 | Encerrando sessão | Média | ✅ Pronto | RN01 |
| HU025 | Mantendo sessão persistente | Média | ✅ Pronto | RN01-RN02 |

### 💬 WhatsApp + IA (Sprint 4)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU026 | Conversando com IA no WhatsApp | Alta | ✅ Pronto | RN01-RN05 |
| HU027 | Recebendo notificações de pedido | Alta | ✅ Pronto | RN01-RN07 |
| HU028 | Detectando intent localmente | Média | ✅ Pronto | RN01-RN02 |
| HU029 | Transferindo para humano | Média | ⏳ Pendente | — |

### 👨‍💼 Admin — Operações (Sprint 3-4)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU030 | Visualizando dashboard | Alta | ✅ Pronto | RN01-RN03 |
| HU031 | Gerenciando produtos (CRUD) | Alta | ✅ Pronto | RN01-RN05 |
| HU032 | Atualizando status de pedido | Alta | ✅ Pronto | RN01-RN03 |
| HU033 | Visualizando lista de clientes | Média | ✅ Pronto | RN01-RN02 |
| HU034 | Promovendo usuário a admin | Média | ✅ Pronto | RN01-RN02 |
| HU035 | Configurando loja | Alta | ✅ Pronto | RN01-RN04 |
| HU036 | Visualizando conversas WhatsApp | Média | ✅ Pronto | RN01 |
| HU037 | Gerenciando leads | Média | ✅ Pronto | RN01 |
| HU038 | Recebendo notificações internas | Alta | ✅ Pronto | RN01-RN06 |

### 🔒 Segurança & LGPD (Sprint 7 — ✅ Completa)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU039 | Aceitando cookies (LGPD) | Alta | ✅ Pronto | RN01-RN05 |
| HU040 | Configurando 2FA para admin | Alta | ✅ Pronto | RN01-RN05 |
| HU041 | Realizando backup automático | Alta | ✅ Pronto | RN01-RN04 |

### 💰 Pagamento Real (Sprint 6 — Pendente, gateway a definir)

| ID | Título | Prioridade | Status | RNs |
|----|--------|-----------|--------|-----|
| HU042 | Pagando via PIX | Alta | ⏳ Pendente | — |
| HU043 | Recebendo confirmação de pagamento | Alta | ⏳ Pendente | — |

## Regras de Negócio Globais

- **RNG01** — WhatsApp SEMPRE armazenado com DDI+DDD+número (ex: `5581999999999`), SEM o 9 depois do DDD
- **RNG02** — Soft delete em produtos (campo `active`) — nunca deletar fisicamente
- **RNG03** — Snapshots de produto nos pedidos (nome, preço, versão) — nunca confiar só em FK
- **RNG04** — Número de pedido formato `BKR-YYYYMM-NNNNNN`
- **RNG05** — Pedidos começam em `PENDING` e transicionam para `PAID` via webhook
- **RNG06** — Admin pode se promover/rebaixar (com cuidado); SUPER_ADMIN só pode ser criado por outro SUPER_ADMIN
- **RNG07** — OpenAI é fallback — sempre tentar detecção local antes (economia de tokens)
- **RNG08** — Notificações admin vão para WhatsApp cadastrado em `integrations_admin_whatsapp`
- **RNG09** — Frete grátis quando pedido ≥ R$ 199 (configurável)
- **RNG10** — Cupom BECKER15 = 15% OFF primeira compra

## Lacunas

- **Gateway de pagamento:** Mercado Pago é candidato, decisão pendente
- **Nota fiscal:** provedor a definir (Focus NFe, eNotas ou Tiny)
- **Política de frete real:** ainda não decidido se integração com transportadora
- **Estratégia de marketing:** canais a definir (Google Ads, Meta Ads)
- **2FA:** provedor TOTP a decidir (Authy, Google Authenticator)

## Próximos passos

- [x] Cliente valida HUs (Paulo — Suporte Gerencial)
- [x] Gerar PRD consolidado (`docs/PRD.md`)
- [ ] Gerar SPEC técnica por sprint (`docs/sprints/sprint-XX-spec.md`)
- [ ] Implementar Sprint 6 (pagamento real) quando gateway for definido
- [ ] Implementar Sprint 14 (LGPD + Segurança)

## Métricas das HUs

- **Total de HUs:** 43
- **Prontas (✅):** 41
- **Pendentes (⏳):** 2 (HU042 Pagamento PIX, HU043 Confirmação pagamento)
- **Por prioridade:**
  - Alta: 27
  - Média: 13
  - Baixa: 3

---

**Última atualização:** 08/08/2026
