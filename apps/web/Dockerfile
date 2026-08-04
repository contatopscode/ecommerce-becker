FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Garante pnpm 9 (compatível com Node 20)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm --version

# ---- Deps ----
FROM base AS deps
# Copia config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/db/package.json ./packages/db/
COPY packages/lib/package.json ./packages/lib/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/

# NÃO usa --frozen-lockfile (lockfile pode ser de versão diferente)
RUN pnpm install --no-frozen-lockfile

# ---- Build ----
FROM base AS builder
# Copia config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* .npmrc* ./
COPY apps/web/package.json ./apps/web/
COPY apps/admin/package.json ./apps/admin/
COPY packages/db/package.json ./packages/db/
COPY packages/lib/package.json ./packages/lib/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/

# Instala deps (gera node_modules completo)
RUN pnpm install --no-frozen-lockfile

# Copia o resto do código
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Gera Prisma Client (agora com prisma disponível)
RUN pnpm --filter @becker/db generate

# Build Next.js
RUN cd apps/web && pnpm build

# ---- Runner ----
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Copia build + node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/next.config.mjs ./apps/web/next.config.mjs
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

USER nextjs
EXPOSE 3000
WORKDIR /app/apps/web
CMD ["npx", "next", "start", "-p", "3000", "-H", "0.0.0.0"]
