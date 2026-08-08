# PRD — Becker E-commerce

> **Product Requirements Document**
> **Versão:** 1.0
> **Data:** 08/08/2026
> **Status:** 🟢 MVP em produção, expansão em planejamento

---

## 1. Visão

Ser a **plataforma de e-commerce oficial da Becker** (produtos de limpeza com 40 anos de mercado), oferecendo uma experiência de compra digital moderna via PWA, atendimento humanizado via WhatsApp com IA, e operação simplificada para a equipe interna — tudo auto-hospedado em infraestrutura própria.

---

## 2. Objetivos

| # | Objetivo | Métrica | Meta |
|---|----------|---------|------|
| 1 | Vender produtos Becker 100% online | % de vendas via canal digital | 30% em 6 meses |
| 2 | Reduzir tempo de atendimento manual | Tempo médio de resposta WhatsApp | < 30s (com IA) |
| 3 | Aumentar recorrência de clientes | Taxa de recompra em 90 dias | > 25% |
| 4 | Operar com custo fixo baixo | Custo mensal de infraestrutura | < R$ 200/mês |
| 5 | Garantir conformidade legal (LGPD) | Pendências regulatórias | 0 |

---

## 3. Não-Objetivos

Esta versão **NÃO** entrega:

- ❌ **App mobile nativo** (iOS/Android) — foco 100% em PWA
- ❌ **Marketplace multi-vendedor** — apenas produtos Becker
- ❌ **Integração com transportadoras reais** (Correios, Total Express) — entrega via motoboy parceiro
- ❌ **Sistema de pagamento próprio** — usaremos gateway externo (a decidir)
- ❌ **Chat humano ao vivo no site** — atendimento só via WhatsApp
- ❌ **B2B completo** com cotação e aprovação — apenas cadastro de empresa básico
- ❌ **Programa de fidelidade / cashback** — fase futura
- ❌ **Recomendações personalizadas por ML** — sugestões simples

---

## 4. Personas

### 👤 Persona 1: Dona de Casa (Cliente Final)
- **Nome:** Maria, 35-55 anos
- **Perfil:** Compra produtos de limpeza para casa, conhece a marca Becker há anos
- **Comportamento:** Navega no celular, prefere WhatsApp para tirar dúvidas
- **Necessidades:** Praticidade, frete rápido, preço justo, produtos confiáveis
- **Dor:** Não tem tempo para ir em loja física, quer resolver tudo pelo celular

### 👤 Persona 2: Pequena Empresa / Escritório
- **Nome:** João, proprietário de escritório
- **Perfil:** Compra em volume para empresa, precisa de NF
- **Comportamento:** Compra 1x por mês, precisa de CNPJ na nota
- **Necessidades:** Compra recorrente, NF, desconto por volume (futuro)
- **Dor:** Processo de compra atual é demorado, sem nota fiscal

### 👤 Persona 3: Atendente Becker (Operação Interna)
- **Nome:** Carlos, equipe de atendimento
- **Perfil:** Gerencia pedidos, tira dúvidas, atualiza status
- **Comportamento:** Usa painel admin, recebe notificações no WhatsApp pessoal
- **Necessidades:** Visão clara dos pedidos, agilidade, automação
- **Dor:** Hoje recebe pedido por WhatsApp e tem que cadastrar manualmente

### 👤 Persona 4: Gerente Becker (Administração)
- **Nome:** Ana, gerente comercial
- **Perfil:** Acompanha vendas, ajusta preços, cadastra produtos
- **Comportamento:** Acessa painel admin diariamente
- **Necessidades:** Relatórios, controle de estoque, gestão de produtos
- **Dor:** Sem visão consolidada de vendas e estoque

---

## 5. Casos de Uso

### Caso de Uso Primário: Compra via Site

**Como** Maria (cliente final), **quero** navegar pelo catálogo, escolher produtos e finalizar a compra pelo celular, **para** receber meus produtos de limpeza em casa sem precisar ir na loja.

**Fluxo:**
1. Maria acessa `becker.pscode.ia.br` pelo celular
2. Navega por categorias ou usa a busca
3. Adiciona produtos ao carrinho
4. Finaliza o checkout (4 steps)
5. Paga via PIX (ou cartão)
6. Recebe confirmação por WhatsApp
7. Acompanha o pedido via link de rastreamento

### Caso de Uso Primário: Compra via WhatsApp

**Como** Maria, **quero** mandar mensagem no WhatsApp da Becker perguntando sobre um produto e fechar a compra por lá, **para** não precisar preencher formulário no site.

**Fluxo:**
1. Maria manda "quero comprar detergente" no WhatsApp
2. IA responde com catálogo resumido
3. IA coleta: itens, versão, quantidade, CEP
4. IA calcula frete e gera link de pagamento
5. Maria paga e recebe confirmação

### Caso de Uso Primário: Gestão de Pedido (Admin)

**Como** Carlos (atendente), **quero** ver os novos pedidos no painel e atualizar o status, **para** manter o cliente informado e a operação fluindo.

**Fluxo:**
1. Carlos recebe notificação no WhatsApp: "novo pedido #BKR-202608-000123"
2. Acessa `/admin/pedidos` no navegador
3. Visualiza detalhes do pedido
4. Marca como "em separação"
5. Sistema envia WhatsApp automático para o cliente
6. Quando enviar, atualiza para "enviado" + código de rastreio

### Caso de Uso Secundário: Auto-cadastro (Lead Capture)

**Como** visitante novo, **quero** digitar meu WhatsApp no checkout e ter meus dados salvos, **para** não precisar preencher tudo de novo na próxima compra.

### Caso de Uso Secundário: Rastreamento de Pedido

**Como** cliente, **quero** acessar o link de rastreamento sem precisar de login, **para** ver o status do meu pedido a qualquer momento.

### Caso de Uso Secundário: Notificações Internas

**Como** gerente, **quero** receber resumo de novos pedidos no meu WhatsApp pessoal, **para** acompanhar as vendas em tempo real sem ficar no PC.

---

## 6. Requisitos Funcionais

### Catálogo e Navegação

- **RF01** — O sistema deve listar produtos ativos, organizados por categoria.
- **RF02** — O sistema deve permitir busca por nome/descrição do produto.
- **RF03** — A busca deve suportar filtros: categoria, faixa de preço, marca, produto eco.
- **RF04** — Cada produto deve ter página dedicada com galeria, descrição, versões e preço.
- **RF05** — Produtos devem ser marcados como: destaque, top, novo, eco (selo verde).
- **RF06** — Categorias devem ter ícone, cor e ordem configuráveis.

### Carrinho e Wishlist

- **RF07** — O carrinho deve ser persistente (Zustand + localStorage).
- **RF08** — O cliente deve poder adicionar/remover produtos do carrinho.
- **RF09** — O sistema deve calcular subtotal, frete e total em tempo real.
- **RF10** — Wishlist deve permitir favoritar/desfavoritar produtos.
- **RF11** — A wishlist deve ter página dedicada em `/favoritos`.

### Checkout

- **RF12** — O checkout deve ter 4 steps: Identificação, Endereço, Frete, Pagamento.
- **RF13** — O sistema deve detectar clientes recorrentes pelo WhatsApp.
- **RF14** — O sistema deve auto-preencher endereço via ViaCEP.
- **RF15** — O sistema deve calcular frete baseado em CEP + peso (PAC, SEDEX, Grátis).
- **RF16** — O sistema deve validar cupons de desconto.
- **RF17** — O sistema deve salvar progresso do checkout (não perder dados ao fechar).
- **RF18** — Pré-cadastro automático: novo WhatsApp digitado = lead capturado.

### Pedidos

- **RF19** — O sistema deve criar pedido com número único formato `BKR-YYYYMM-NNNNNN`.
- **RF20** — O sistema deve salvar snapshot dos itens (nome, preço, versão) no pedido.
- **RF21** — Pedidos devem ter status: PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED, REFUNDED.
- **RF22** — Pedidos devem ter `paymentStatus`: PENDING, PAID, FAILED, REFUNDED.
- **RF23** — Cliente deve poder rastrear pedido via URL pública `/pedido/[number]`.
- **RF24** — Rastreamento deve ter timeline visual do status.

### Pagamento

- **RF25** — O sistema deve suportar PIX, cartão de crédito e boleto.
- **RF26** — Gateway de pagamento a definir (Mercado Pago é candidato).
- **RF27** — Webhook de pagamento deve atualizar status do pedido automaticamente.
- **RF28** — Sistema deve suportar estorno/refund.
- ⚠️ **Status atual:** pagamento é SIMULADO (sprint pendente)

### WhatsApp + IA

- **RF29** — O sistema deve integrar com Evolution API (WhatsApp).
- **RF30** — Webhook da Evolution deve receber mensagens e responder via IA.
- **RF31** — IA deve usar OpenAI GPT-4o-mini com system prompt especializado.
- **RF32** — Sistema deve detectar intent local (regex) antes de chamar OpenAI (economia).
- **RF33** — IA deve consultar catálogo, status de pedido e auxiliar no checkout.
- **RF34** — IA deve transferir para humano quando não souber responder.
- **RF35** — Contexto da conversa deve ser persistido por cliente (WhatsAppConversation).

### Notificações

- **RF36** — Sistema deve enviar 7 templates WhatsApp para cliente:
  - Pedido criado
  - Pagamento aprovado
  - Em separação
  - Enviado (com rastreio)
  - Entregue
  - Cancelado
  - OTP de login
- **RF37** — Sistema deve enviar 6 templates WhatsApp para admin:
  - Novo pedido
  - Pagamento confirmado
  - Pedido enviado
  - Pedido entregue
  - Pedido cancelado
  - Novo lead capturado
- **RF38** — WhatsApp deve ser normalizado SEM o 9 depois do DDD (Business API).

### Autenticação

- **RF39** — Login via OTP no WhatsApp (código 6 dígitos).
- **RF40** — OTP deve ter hash sha256 e expirar em 10 minutos.
- **RF41** — Sessão deve ser cookie httpOnly de 30 dias.
- **RF42** — Sistema deve suportar 3 roles: CUSTOMER, ADMIN, SUPER_ADMIN.
- **RF43** — Admin pode promover/rebaixar outros usuários pelo painel.

### Painel Admin

- **RF44** — Dashboard com métricas: pedidos, receita, leads.
- **RF45** — CRUD de produtos (criar, editar, soft delete).
- **RF46** — Listagem de pedidos com filtro por status.
- **RF47** — Mudança de status de pedido (envia WhatsApp automático).
- **RF48** — Gestão de clientes (lista + role).
- **RF49** — Lista de leads (WhatsApps pré-cadastrados).
- **RF50** — Histórico de conversas WhatsApp.
- **RF51** — Configurações em 4 abas: Frete, Promoções, Integrações, Geral.

### Páginas Institucionais

- **RF52** — Páginas: `/sobre`, `/empresas`, `/ofertas`, `/atendimento`.
- **RF53** — Footer com links, redes sociais, contato.

### PWA

- **RF54** — Manifesto configurado.
- **RF55** — Service worker para cache offline.
- **RF56** — Instalável no celular (Add to Home Screen).

---

## 7. Requisitos Não-Funcionais

### Performance

- **RNF01** — Lighthouse score > 90 (mobile + desktop).
- **RNF02** — First Contentful Paint < 1.5s.
- **RNF03** — Largest Contentful Paint < 2.5s.
- **RNF04** — Time to Interactive < 3s.
- **RNF05** — Cumulative Layout Shift < 0.1.
- **RNF06** — API response < 300ms (p95).

### Segurança

- **RNF07** — HTTPS obrigatório (Caddy com Let's Encrypt).
- **RNF08** — Cookies de sessão httpOnly + Secure + SameSite=Lax.
- **RNF09** — Senhas/tokens em `.env`, nunca commitados.
- **RNF10** — Validação de input em TODA API (Zod).
- **RNF11** — SQL Injection prevenido (Prisma queries parametrizadas).
- **RNF12** — XSS prevenido (React + sanitização).
- **RNF13** — Rate limiting nas APIs (Sprint 14).

### Disponibilidade

- **RNF14** — Uptime target: 99% (auto-hospedado).
- **RNF15** — Backup diário do PostgreSQL (Sprint 14).
- **RNF16** — Deploy via Easypanel (push to main).

### LGPD / Compliance

- **RNF17** — Banner de consentimento de cookies (Sprint 14).
- **RNF18** — Política de privacidade pública.
- **RNF19** — Termos de uso.
- **RNF20** — Opt-in para marketing/newsletter.

### Acessibilidade

- **RNF21** — Contraste mínimo WCAG AA.
- **RNF22** — Textos alternativos em imagens.
- **RNF23** — Navegação por teclado.

### Observabilidade

- **RNF24** — Logs explícitos com prefixo `[modulo]`.
- **RNF25** — Sentry para tracking de erros (Sprint 16).
- **RNF26** — Métricas de negócio no painel admin.

### Custo

- **RNF27** — Custo fixo de infraestrutura < R$ 200/mês.
- **RNF28** — Custo variável de IA < R$ 100/mês (até 500k tokens).

### Internacionalização

- **RNF29** — Idioma principal: Português (pt-BR).
- **RNF30** — Moeda: Real (BRL), formato `R$ 0,00`.

---

## 8. Critérios de Aceite (Definição de "Pronto")

### Para uma feature ser considerada "pronta":

- [ ] Código implementado e mergeado na `main`
- [ ] Testada manualmente em produção
- [ ] Sem erros no console do navegador
- [ ] Responsiva (mobile + desktop)
- [ ] Logs explícitos adicionados (`console.log('[modulo] ...')`)
- [ ] Validações de input implementadas
- [ ] Sem regressões em features existentes
- [ ] Documentação atualizada (se aplicável)

### Para o MVP ser considerado "em produção":

- [x] Loja pública acessível em `https://becker.pscode.ia.br`
- [x] Checkout completo (4 steps) funcional
- [x] Pedidos sendo criados e salvos
- [x] Painel admin operacional
- [x] WhatsApp IA respondendo clientes
- [x] Notificações admin funcionando
- [ ] ⚠️ Pagamento real (sprint pendente)

---

## 9. Métricas de Sucesso

### Negócio

| Métrica | Meta |
|---------|------|
| Taxa de conversão (visitantes → pedidos) | > 2% |
| Ticket médio | > R$ 80 |
| Taxa de recompra (90 dias) | > 25% |
| Abandono de carrinho | < 70% |
| Vendas via WhatsApp | > 15% do total |

### Operação

| Métrica | Meta |
|---------|------|
| Tempo médio de resposta WhatsApp (IA) | < 30s |
| % de pedidos com status atualizado em < 24h | > 90% |
| Uptime | > 99% |
| Erros 500 em produção | < 0,1% das requests |

### Técnicas

| Métrica | Meta |
|---------|------|
| Lighthouse Performance | > 90 |
| API p95 latency | < 300ms |
| Bundle JS (gzipped) | < 200KB |
| Tempo de build | < 2min |

---

## 10. Riscos & Mitigações

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|---------------|---------|-----------|
| 1 | **VPS cair** e perder dados | Baixa | Crítico | Backup diário do Postgres (Sprint 14) + plano de disaster recovery |
| 2 | **WhatsApp banido** (número bloqueado pelo WhatsApp) | Média | Alto | Compliance com ToS WhatsApp, número dedicado, fallback via SMS futuro |
| 3 | **OpenAI sair do ar** / custo explodir | Baixa | Médio | Implementar fallback de detecção de intent 100% local; trocar provedor (Anthropic, Gemini) |
| 4 | **Vazamento de dados** (LGPD) | Baixa | Crítico | Senhas hasheadas, cookies httpOnly, auditoria de segurança, DPO definido |
| 5 | **Gateway de pagamento cair** | Baixa | Alto | Manter pagamento simulado como fallback; multi-gateway futuro |
| 6 | **Escalar manualmente** e o sistema não aguentar | Média | Médio | Arquitetura já permite escalar (Postgres, Next.js); monitoramento de métricas |

---

## 11. Decisões em Aberto

| # | Decisão | Pendência | Bloqueia |
|---|---------|-----------|----------|
| 1 | **Qual gateway de pagamento usar?** | Avaliar Mercado Pago vs PagSeguro vs Stripe vs Asaas | Sprint 6 (pagamento real) |
| 2 | **Fornecedor de Nota Fiscal** | Avaliar Focus NFe vs eNotas vs Tiny | Sprint 7 |
| 3 | **Política de frete grátis** | Valor mínimo, regiões, transportadora | Configurações (já implementado como `Setting`) |
| 4 | **Estratégia de marketing** | Google Ads, Meta Ads, influencers | Sprint 8 |

---

## 12. Roadmap Resumido

| Mês | Foco | Entregas |
|-----|------|----------|
| **Atual (Agosto/26)** | Higienização + Docs | Limpeza de código morto, docs completas, HUs |
| **Setembro/26** | LGPD + Segurança | Banner cookies, 2FA admin, backup automático |
| **Outubro/26** | Pagamento Real | Gateway escolhido integrado, webhook funcional |
| **Novembro/26** | NF + SEO | Nota fiscal automática, meta tags, sitemap |
| **Dezembro/26** | Marketing | GA4, Pixel, cupom automático primeira compra |
| **Janeiro/27** | B2B + Operacional | Cadastro empresa, relatórios avançados |

Estimativa total: **6 meses** para plataforma completa.

---

**Última atualização:** 08/08/2026
**Versão:** 1.0
**Próxima revisão:** após Sprint 6 (pagamento real)
