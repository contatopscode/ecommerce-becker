FROM node:20-alpine
WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/db/package.json ./packages/db/
COPY packages/lib/package.json ./packages/lib/
COPY packages/ui/package.json ./packages/ui/
COPY packages/types/package.json ./packages/types/

RUN pnpm install --frozen-lockfile

COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @becker/db generate
RUN pnpm --filter @becker/admin build

ENV NODE_ENV=production
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

WORKDIR /app/apps/admin
CMD ["pnpm", "start"]
