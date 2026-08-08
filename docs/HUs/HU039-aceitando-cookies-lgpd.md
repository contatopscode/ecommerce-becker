---
hu_id: HU039
status: Pendente
release: v1.1 (Sprint 14)
modulo: LGPD
prioridade: Alta
demanda: becker-ecommerce
---

### HU039 — Aceitando cookies conforme LGPD

**Como:** visitante acessando a loja pela primeira vez
**Quero:** ver um banner pedindo consentimento para uso de cookies
**Para que:** a empresa cumpra a LGPD e eu saiba o que está sendo rastreado

#### Critérios de Aceitação
1. Banner aparece no primeiro acesso (quando não há consentimento salvo)
2. Banner tem 2 opções: "Aceitar todos" e "Configurar"
3. Aceitar todos: salva consentimento em cookie + localStorage
4. Configurar: mostra modal com categorias (essencial, analytics, marketing)
5. Categoria "essencial" sempre ativa (não pode ser desmarcada)
6. Após aceitar, banner desaparece
7. Banner reaparece se consentimento expirar (365 dias)
8. Link "Política de Privacidade" no banner
9. Pixel do Facebook e GA4 só carregam se consentimento = true

#### Requisitos Funcionais

##### Banner de Consentimento
Aparece no rodapé da página (não-modal) com:
- Texto: "Usamos cookies para melhorar sua experiência. Ao continuar, você concorda com nossa [Política de Privacidade]."
- Botão "Aceitar todos" (verde)
- Botão "Configurar" (outline)
- Ícone de cadeado

##### Modal de Configuração
3 categorias explicadas:
- **Essencial** (sempre on): login, carrinho, sessão
- **Analytics** (opt-in): Google Analytics 4, pageviews
- **Marketing** (opt-in): Facebook Pixel, Google Ads

Cada categoria com toggle + descrição.

##### Persistência do Consentimento
- Cookie `becker_consent` (httpOnly=false, 365 dias)
- Valor: JSON `{ essential: true, analytics: bool, marketing: bool, timestamp }`
- localStorage `becker_consent_v1` (backup)

##### Scripts Condicionais
- GA4 só carrega se `analytics: true`
- Facebook Pixel só carrega se `marketing: true`
- Scripts essenciais sempre carregam

#### Regras de Negócio
- **RN01** — Categoria "essencial" é obrigatória (sempre true)
- **RN02** — Consentimento expira em 365 dias
- **RN03** — Banner não aparece se já há consentimento válido
- **RN04** — LGPD: opt-in (não opt-out) — usuário deve aceitar explicitamente
- **RN05** — Política de privacidade deve ser pública em `/privacidade`

#### Fluxos de Exceção
- **Cookies desabilitados no browser:** mostrar aviso que funcionalidade pode ser limitada
- **Banner ignorado (X cliques):** não fechar, forçar escolha após 3 pageviews
- **Erro ao salvar consentimento:** tentar localStorage como fallback

#### Dependências
- Política de privacidade (criar página `/privacidade`)
- GA4 (Sprint 8)
- Facebook Pixel (Sprint 8)
