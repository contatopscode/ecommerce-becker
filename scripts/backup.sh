#!/bin/bash
# ============================================================
# Becker - Script de Backup Automático do PostgreSQL
# ============================================================
# Uso: bash scripts/backup.sh
# Variáveis necessárias: DATABASE_URL, BACKUP_DIR (opcional)
# ============================================================

set -e

# Carrega .env se existir
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Configurações
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/becker_${TIMESTAMP}.sql.gz"

# Cria diretório se não existir
mkdir -p "$BACKUP_DIR"

# Parse DATABASE_URL (formato: postgresql://user:pass@host:port/db?params)
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL não definida"
  exit 1
fi

# Extrai componentes da URL
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:/]+):?([0-9]*)/([^?]+)(.*)?"
if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASS="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]:-5432}"
  DB_NAME="${BASH_REMATCH[5]}"
  DB_PARAMS="${BASH_REMATCH[6]}"
else
  echo "❌ DATABASE_URL inválida: $DATABASE_URL"
  exit 1
fi

echo "🔄 Iniciando backup do banco '$DB_NAME' em '$DB_HOST'..."

# Faz o dump e comprime
export PGPASSWORD="$DB_PASS"
pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  | gzip > "$BACKUP_FILE"

# Verifica se o backup foi criado
if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
  SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "✅ Backup concluído: $BACKUP_FILE ($SIZE)"
else
  echo "❌ Falha ao criar backup"
  exit 1
fi

# Remove backups antigos (retenção)
echo "🧹 Removendo backups com mais de $RETENTION_DAYS dias..."
find "$BACKUP_DIR" -name "becker_*.sql.gz" -mtime +$RETENTION_DAYS -delete
REMAINING=$(ls "$BACKUP_DIR"/becker_*.sql.gz 2>/dev/null | wc -l)
echo "📦 Backups restantes: $REMAINING"

echo "✨ Backup finalizado com sucesso!"
