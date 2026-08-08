# Sprint 7 — LGPD + Segurança

> Documentação da Sprint 7 (Fase 1 do plano de expansão).
> HUs implementadas: HU039, HU040, HU041 + Rate Limiting.

---

## HU041 — Backup Automático do PostgreSQL

### Implementação

**Script de backup:** `scripts/backup.sh`
- Faz `pg_dump` e comprime com gzip
- Salva em `BACKUP_DIR` (padrão `./backups`)
- Retenção configurável via `BACKUP_RETENTION_DAYS` (padrão 7 dias)
- Nome do arquivo: `becker_YYYYMMDD_HHMMSS.sql.gz`

**API de backup:** `POST /api/admin/backup`
- Protegida por `BACKUP_TOKEN` (header `x-backup-token`)
- Pode ser chamada por serviço de cron externo
- Retorna lista de backups + metadados

### Como agendar

#### Opção 1: Cron-job.org (grátis, recomendado)

1. Acesse https://cron-job.org
2. Crie uma conta
3. Adicione um novo cron job:
   - **URL:** `https://becker.pscode.ia.br/api/admin/backup`
   - **Método:** POST
   - **Header:** `x-backup-token: SEU_BACKUP_TOKEN`
   - **Intervalo:** Diariamente às 03:00 (horário de baixo tráfego)

#### Opção 2: Easypanel Scheduled Task

Se o Easypanel suportar:
```yaml
schedule: "0 3 * * *"
command: "bash /app/scripts/backup.sh"
```

#### Opção 3: Crontab do servidor (se tiver acesso SSH)

```bash
# Editar crontab
crontab -e

# Adicionar linha (roda todo dia às 3h)
0 3 * * * cd /opt/becker && bash scripts/backup.sh >> /var/log/becker-backup.log 2>&1
```

### Variáveis de ambiente

Adicionar no `.env` (e no Easypanel):

```env
# Token de proteção da API de backup (gere algo forte)
BACKUP_TOKEN="seu-token-seguro-aqui-com-32-chars-min"

# Diretório de backup (padrão: ./backups)
BACKUP_DIR="/app/backups"

# Retenção em dias (padrão: 7)
BACKUP_RETENTION_DAYS="7"
```

### Restauração

Para restaurar um backup:

```bash
# 1. Baixar o arquivo (do container ou local)
docker compose exec web ls /app/backups/

# 2. Copiar para fora
docker cp becker-web:/app/backups/becker_20260808_030000.sql.gz ./

# 3. Descomprimir e restaurar
gunzip becker_20260808_030000.sql.gz
export PGPASSWORD="sua-senha"
psql -h HOST -U USER -d DATABASE < becker_20260808_030000.sql
```

### Disaster Recovery

Em caso de perda total do banco:

1. Provisionar novo Postgres
2. Atualizar `DATABASE_URL` no `.env`
3. Rodar migrações: `pnpm db:push`
4. Restaurar último backup (passos acima)
5. Verificar integridade: `pnpm db:studio`

---

## HU039 — Banner de Cookies (LGPD)

### Implementação

**Componente:** `apps/web/src/components/CookieBanner.tsx`
**Helper:** `apps/web/src/lib/consent.ts`
**Páginas:** `/privacidade` e `/termos`

### Categorias de cookies

- **Essencial** (sempre ativo): sessão, carrinho, autenticação
- **Analytics** (opt-in): GA4, pageviews
- **Marketing** (opt-in): Facebook Pixel, Google Ads

### Como configurar no Easypanel

1. Build novo já inclui o banner
2. Banner aparece automaticamente no primeiro acesso
3. Após aceitar, fica salvo em `localStorage` + cookie por 365 dias

### Páginas criadas

- `/privacidade` — Política de Privacidade (LGPD)
- `/termos` — Termos de Uso

### Como adicionar novos scripts condicionais

Em `apps/web/src/lib/consent.ts`, na função `loadScriptsForConsent()`:

```ts
if (consent.analytics) {
  // Carregar Google Analytics
  // Carregar Hotjar
}
if (consent.marketing) {
  // Carregar Facebook Pixel
  // Carregar Google Ads
}
```

---

## HU040 — 2FA para Admin (TOTP)

### Implementação

**Biblioteca:** `otplib` (TOTP padrão RFC 6238)
**Campo no User:** `twoFactorSecret`, `twoFactorEnabled`
**Fluxo:** Login OTP WhatsApp → se admin tem 2FA → pede código TOTP

### Como ativar (admin)

1. Acessar `/admin/seguranca` (ou em `/admin/configuracoes`)
2. Clicar em "Ativar 2FA"
3. Escanear QR Code com Google Authenticator / Authy
4. Digitar código de 6 dígitos para confirmar
5. Salvar códigos de backup (8 códigos de uso único)

### Como funciona

1. Admin faz login normal (WhatsApp OTP)
2. Se tem 2FA ativo: sistema pede código TOTP
3. Admin digita código do app authenticator
4. Sistema valida e libera sessão

### Variáveis de ambiente

Nenhuma nova necessária. A chave TOTP é gerada por usuário.

### Códigos de backup

Ao ativar 2FA, sistema gera 8 códigos de 8 caracteres (ex: `ABCD-1234`).
Cada código pode ser usado uma vez se perder o celular.
Admin pode ver/regenerar em `/admin/seguranca`.

### Migração Prisma

```prisma
model User {
  // ...campos existentes
  twoFactorSecret    String?  // Base32 encoded TOTP secret
  twoFactorEnabled   Boolean  @default(false)
  twoFactorBackupCodes String? // JSON array de códigos hasheados
}
```

---

## Rate Limiting

### Implementação

**Helper:** `apps/web/src/lib/rate-limit.ts`
**Storage:** In-memory Map (suficiente para 1 instância Next.js)

### Limites aplicados

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `POST /api/auth/otp/request` | 5 req | 15 min |
| `POST /api/auth/otp/verify` | 10 req | 15 min |
| `POST /api/orders/create` | 10 req | 1 hora |
| `POST /api/admin/*` | 100 req | 1 min |
| `GET /api/cep` | 30 req | 1 min |
| `GET /api/search` | 60 req | 1 min |

### Configuração

Para ambientes com múltiplas instâncias, substituir in-memory por Redis (Upstash).

---

**Última atualização:** 08/08/2026
