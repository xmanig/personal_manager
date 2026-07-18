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
