# Force rebuild 2026-08-04 19:32
# Rebuild Sprint 3.1 - sincronizar schema/db
# Force rebuild 2026-08-05 12:35
# Becker E-commerce - Dockerfile simplificado
FROM node:20-bookworm-slim

WORKDIR /app

# Instala OpenSSL pro Prisma + dumb-init
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Habilita pnpm 9
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV PATH="/root/.local/share/pnpm:$PATH"

# Copia config files primeiro (cache melhor)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
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
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
