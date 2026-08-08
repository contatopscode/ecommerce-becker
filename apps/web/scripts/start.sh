#!/bin/sh
# ============================================================
# Becker - Script de start do container
# Aplica schema do Prisma antes de iniciar o Next.js
# Resolve problema de migrations automáticas em deploy
# ============================================================

set -e

echo "🚀 [Becker] Iniciando container..."
echo "📅 $(date)"

# Verifica se DATABASE_URL está configurada
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não configurada! Saindo..."
  exit 1
fi

# Aplica schema do Prisma (cria tabelas novas se necessário)
# Idempotente: não muda nada se schema já tá aplicado
echo "🗄️  Aplicando schema do banco..."
cd /app
pnpm --filter @becker/db prisma db push --skip-generate --accept-data-loss 2>&1 | head -20

if [ $? -eq 0 ]; then
  echo "✅ Schema OK"
else
  echo "⚠️  Aviso: prisma db push retornou erro. Tentando continuar..."
fi

# Inicia Next.js
echo "🎯 Iniciando Next.js..."
cd /app/apps/web
exec npx next start -p 3000 -H 0.0.0.0
