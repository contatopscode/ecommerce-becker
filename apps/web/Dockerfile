# Force rebuild 2026-08-04 19:32
# Rebuild Sprint 3.1 - sincronizar schema/db
# Force rebuild 2026-08-05 12:35
# Force rebuild Sprint 7 - LGPD + Segurança (2026-08-08)
# Force rebuild Sprint 9 - Cart Recovery (aplica DB schema no startup) 2026-08-08
# Force rebuild 2026-08-09: pg_dump 17 (server PG é 17.10) + fix de backup
# Becker E-commerce - Dockerfile simplificado
FROM node:20-bookworm-slim

WORKDIR /app

# Instala OpenSSL pro Prisma + postgresql-client-17 (compatível com server PG 17) + dumb-init
# O bookworm-slim só tem postgresql-client-15 nos repos default, então adicionamos o repo oficial pgdg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg \
    && install -d /usr/share/postgresql-common/pgdg \
    && curl -o /usr/share/postgresql-common/pgdg/apt.postgresql.org.asc --fail https://www.postgresql.org/media/keys/ACCC4CF8.asc \
    && echo "deb [signed-by=/usr/share/postgresql-common/pgdg/apt.postgresql.org.asc] https://apt.postgresql.org/pub/repos/apt bookworm-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
       openssl ca-certificates postgresql-client-17 dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Habilita pnpm 9
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV PATH="/root/.local/share/pnpm:$PATH"

# Copia config files primeiro (cache melhor)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/lib/package.json ./packages/lib/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/

# Instala deps
RUN pnpm install --no-frozen-lockfile

# Copia source
COPY . .

# Gera Prisma Client e builda
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @becker/db generate
RUN cd apps/web && pnpm build

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000
WORKDIR /app/apps/web

# Script de start: aplica schema do Prisma antes de iniciar Next.js
# Garante que tabelas novas (CartRecovery, etc) sejam criadas no startup
COPY apps/web/scripts/start.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh
CMD ["/app/scripts/start.sh"]
