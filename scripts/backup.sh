#!/bin/sh
set -e

BACKUP_DIR=${BACKUP_DIR:-./backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}
DB_NAME=${DB_NAME:-personal_manager}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-db}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_FILE="${DB_NAME}_${TIMESTAMP}.sql.gz"
PDF_FILE="pdfs_${TIMESTAMP}.tar.gz"

mkdir -p "$BACKUP_DIR"

# Find the latest backup
LATEST_DB=$(ls -t "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | head -1)

if [ -n "$LATEST_DB" ]; then
  # Get the latest change across all tracked tables
  LAST_CHANGE=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -A -c "
    SELECT GREATEST(
      COALESCE((SELECT MAX(updatedAt) FROM \"Note\"), '1970-01-01'),
      COALESCE((SELECT MAX(updatedAt) FROM \"Bill\"), '1970-01-01'),
      COALESCE((SELECT MAX(updatedAt) FROM \"CalendarEvent\"), '1970-01-01'),
      COALESCE((SELECT MAX(updatedAt) FROM \"GoogleAccount\"), '1970-01-01'),
      COALESCE((SELECT MAX(updatedAt) FROM \"Folder\"), '1970-01-01')
    ) AS last_change;
  " 2>/dev/null)

  # Get the backup file's timestamp (strip filename prefix/suffix)
  BACKUP_TIME=$(echo "$LATEST_DB" | sed "s/.*${DB_NAME}_//;s/\.sql\.gz$//" | sed 's/\([0-9]\{8\}\)_\([0-9]\{6\}\)/\1 \2/')
  BACKUP_TS=$(date -d "$BACKUP_TIME" +%s 2>/dev/null || echo 0)
  CHANGE_TS=$(date -d "$LAST_CHANGE" +%s 2>/dev/null || echo 0)

  if [ "$CHANGE_TS" -le "$BACKUP_TS" ] 2>/dev/null; then
    echo "No changes since last backup ($(basename "$LATEST_DB")). Skipping."
    exit 0
  fi
fi

pg_dump -h "$DB_HOST" -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/$DB_FILE"
echo "DB backup: $BACKUP_DIR/$DB_FILE ($(du -h "$BACKUP_DIR/$DB_FILE" | cut -f1))"

if [ "$1" = "--with-pdfs" ]; then
  if docker compose ps -q app >/dev/null 2>&1; then
    docker compose exec -T app tar czf - /app/backend/pdfs 2>/dev/null > "$BACKUP_DIR/$PDF_FILE" || true
    echo "PDF backup: $BACKUP_DIR/$PDF_FILE ($(du -h "$BACKUP_DIR/$PDF_FILE" | cut -f1))"
  fi
fi

find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
find "$BACKUP_DIR" -name "pdfs_*.tar.gz" -type f -mtime +90 -delete
