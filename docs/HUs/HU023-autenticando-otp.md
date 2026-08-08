---
hu_id: HU023
status: Aprovado
release: v1.0
modulo: Autenticacao
prioridade: Alta
demanda: becker-ecommerce
---

### HU023 — Autenticando via OTP no WhatsApp

**Como:** cliente ou admin
**Quero:** fazer login apenas com meu WhatsApp (sem senha)
**Para que:** acessar minha conta, pedidos, ou painel admin de forma simples e segura

#### Critérios de Aceitação
1. Cliente digita WhatsApp na tela de login
2. Sistema envia código de 6 dígitos via WhatsApp (Evolution API)
3. Cliente digita código e é autenticado
4. Código expira em 10 minutos
5. Código é hasheado (sha256) antes de salvar
6. Sessão criada com cookie httpOnly de 30 dias
7. Após 5 tentativas erradas, bloquear por 15 minutos
8. Botão "reenviar código" disponível após 60 segundos

#### Requisitos Funcionais

##### Fluxo de Solicitação
1. Cliente acessa `/conta` ou `/admin/login`
2. Digita WhatsApp no formato `(XX) XXXXX-XXXX` ou `XXXXXXXXXXX`
3. Frontend normaliza para DDI+DDD+número (ex: `5581999999999`)
4. POST `/api/auth/otp/request` com `{ whatsapp }`
5. Backend gera código de 6 dígitos (random)
6. Backend hasheia código (sha256)
7. Backend salva hash em cookie temporário (httpOnly)
8. Backend envia WhatsApp com template "OTP de login" + código
9. Cliente recebe código no WhatsApp

##### Fluxo de Verificação
1. Cliente digita código de 6 dígitos
2. POST `/api/auth/otp/verify` com `{ whatsapp, code }`
3. Backend compara hash do código enviado vs hash do cookie
4. Se match: criar/buscar User, gerar sessão, retornar dados
5. Se não: incrementar contador de tentativas, retornar erro

##### Geração de Sessão
- Cookie `becker_session` httpOnly, Secure, SameSite=Lax
- Valor: JWT assinado com NEXTAUTH_SECRET
- Payload: `{ userId, role, exp: now + 30d }`
- Renovação automática a cada request (se faltam < 7 dias)

#### Regras de Negócio
- **RN01** — Código de 6 dígitos, numérico, gerado via `crypto.randomInt(100000, 999999)`
- **RN02** — Hash sha256 antes de salvar (nunca plaintext)
- **RN03** — Expiração: 10 minutos após geração
- **RN04** — Máximo de 5 tentativas por código (após isso, gerar novo)
- **RN05** — Rate limit: 5 requests por IP a cada 15 minutos

#### Fluxos de Exceção
- **WhatsApp inválido:** erro 400 "Formato inválido"
- **WhatsApp não cadastrado:** erro 404 "WhatsApp não encontrado" (mas pode auto-cadastrar via checkout)
- **Código expirado:** erro 400 "Código expirado, solicite novo"
- **Código errado:** erro 400 "Código inválido" (incrementar tentativas)
- **Muitas tentativas:** erro 429 "Muitas tentativas, aguarde X minutos"
- **Erro Evolution API:** erro 500 "Não foi possível enviar o código"

#### Dependências
- Evolution API (WhatsApp)
- Cookie httpOnly (Next.js)
- Crypto module (Node)
