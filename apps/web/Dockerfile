FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# ---- Deps ----
FROM base AS deps
# Copia TUDO primeiro pra ter pnpm-lock se existir
COPY . .
# Se não tiver lockfile, gera um
RUN if [ ! -f pnpm-lock.yaml ]; then pnpm install --no-frozen-lockfile; fi
# Instala deps de todos workspaces
RUN pnpm install --prefer-offline

# ---- Build ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @becker/db generate
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
