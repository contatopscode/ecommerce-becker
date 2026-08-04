# Guia de Deploy — VPS Self-Hosted

## 🐳 Arquitetura

```
┌─────────────────────────────────┐
│         VPS (213.199.32.229)    │
├─────────────────────────────────┤
│                                 │
│  [nginx/Caddy] :80, :443        │
│       ↓ proxy_pass              │
│  [web:3000] [admin:3001]       │
│       ↓                         │
│  [postgres:5432]                │
│                                 │
│  [evolution-api]                │
│                                 │
└─────────────────────────────────┘
```

## 📋 Pré-requisitos

- Docker 24+ e Docker Compose 2+
- 4GB+ de RAM
- 20GB+ de disco
- Domínio apontando para IP da VPS
- Portas 80, 443 liberadas

## 🚀 Deploy passo a passo

### 1. Clone o repo na VPS

```bash
cd /opt
git clone https://github.com/contatopscode/ecommerce-becker.git becker
cd becker
```

### 2. Configure o `.env`

```bash
cp .env.example .env
nano .env
# Preencha as variáveis (veja exemplo abaixo)
```

### 3. Variáveis obrigatórias

```env
DATABASE_URL=postgresql://postgres:ebedd7b79bb9747c65e4@bancos2026_postgres:5432/banco2026?sslmode=disable
DATABASE_URL_INTERNAL=postgresql://postgres:ebedd7b79bb9747c65e4@bancos2026_postgres:5432/banco2026?sslmode=disable
EVOLUTION_API_URL=https://evolution-evolution-api.vcli1q.easypanel.host
EVOLUTION_API_KEY=A604254F256C-4789-A1BA-256DD08B9455
EVOLUTION_INSTANCE=Vigilia
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=https://becker.pscode.ia.br
SITE_DOMAIN=https://becker.pscode.ia.br
NODE_ENV=production
```

### 4. Build e start

```bash
# Build das imagens
docker compose build

# Subir stack
docker compose up -d

# Rodar migrations + seed
docker compose exec web pnpm db:push
docker compose exec web pnpm db:seed
```

### 5. SSL com Caddy (recomendado)

Caddy gera SSL automático via Let's Encrypt. Veja `docker-compose.yml` para config.

## 🔄 Atualizar (deploy de nova versão)

```bash
cd /opt/becker
git pull origin main
docker compose build
docker compose up -d
```

## 📊 Monitoramento

- **Logs:** `docker compose logs -f web`
- **Prisma Studio:** `docker compose exec web pnpm db:studio` (temporário)
- **Métricas:** adicionar Prometheus + Grafana (próxima fase)

## 🔒 Segurança

- ✅ SSL via Caddy (auto-renew)
- ✅ Firewall liberando só 80, 443, 22
- ✅ Senhas em `.env` (não commitar)
- ✅ Backup diário do Postgres
- ✅ Rate limiting via Caddy
- ✅ Headers de segurança (CSP, X-Frame, etc)
