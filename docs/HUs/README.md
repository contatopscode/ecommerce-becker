# Histórias de Usuário (HUs) — Becker E-commerce

> Histórias de Usuário no formato **Blue Technology** (Como/Quero/Para que + RNs + Critérios de Aceitação).

## 📋 Índice Geral

Veja o documento consolidado: [`documento-requisitos-v1.md`](./documento-requisitos-v1.md)

Ele lista todas as 43 HUs organizadas por módulo, com status (✅ Pronto / ⏳ Pendente) e prioridade.

## 📁 HUs Detalhadas (individuais)

| HU | Módulo | Título | Status |
|----|--------|--------|--------|
| [HU001](./HU001-navegando-catalogo.md) | Catálogo | Navegando pelo catálogo de produtos | ✅ |
| [HU013](./HU013-finalizando-checkout.md) | Checkout | Finalizando compra via checkout 4 steps | ✅ |
| [HU020](./HU020-criando-pedido.md) | Pedidos | Criando pedido com snapshot de itens | ✅ |
| [HU023](./HU023-autenticando-otp.md) | Autenticação | Autenticando via OTP no WhatsApp | ✅ |
| [HU026](./HU026-conversando-ia-whatsapp.md) | WhatsApp | Conversando com a IA no WhatsApp | ✅ |
| [HU032](./HU032-atualizando-status-pedido.md) | Admin | Atualizando status de pedido (admin) | ✅ |
| [HU039](./HU039-aceitando-cookies-lgpd.md) | LGPD | Aceitando cookies conforme LGPD | ⏳ Pendente |
| [HU042](./HU042-pagando-via-pix.md) | Pagamento | Pagando via PIX | ⏳ Pendente |

> As demais HUs (HU002-HU012, HU014-HU019, HU021-HU022, HU024-HU025, HU027-HU031, HU033-HU038, HU040-HU041, HU043) estão resumidas no documento de requisitos consolidado.

## 📝 Formato das HUs

Cada HU segue o padrão Blue Technology:

```markdown
---
hu_id: HUxxx
status: Pendente | Em desenvolvimento | Aprovado
release: v1.0
modulo: Catalogo | Checkout | Pagamento | etc
prioridade: Alta | Media | Baixa
demanda: becker-ecommerce
---

### HUxxx — [Verbo no gerúndio + objeto]

**Como:** [persona]
**Quero:** [ação]
**Para que:** [benefício]

#### Critérios de Aceitação
1. [testável]
2. [testável]
3. [testável]

#### Requisitos Funcionais
[descrição detalhada]

#### Regras de Negócio
- **RN01** — [regra de negócio]
- **RN02** — [regra de negócio]

#### Fluxos de Exceção
- [erro X] → [comportamento]

#### Dependências
- HUxxx (outra HU)
```

## 🔄 Status

- **Pendente** — recém criada, aguardando aprovação
- **Em desenvolvimento** — aprovada, sendo implementada
- **Aprovado** — implementada e validada em produção

## 🏷️ Prioridades

- **Alta** — bloqueia o negócio / MVP
- **Média** — importante mas não crítico
- **Baixa** — nice-to-have

---

**Última atualização:** 08/08/2026
