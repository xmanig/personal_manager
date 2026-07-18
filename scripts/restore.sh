#!/bin/sh
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-file.gz>"
  echo "Available backups:"
  ls -lh ./backups/*.sql.gz 2>/dev/null || echo "  (no backups found)"
  exit 1
fi

FILE="$1"
DB_NAME=${DB_NAME:-personal_manager}
DB_USER=${DB_USER:-postgres}

if [ ! -f "$FILE" ]; then
  echo "Error: File '$FILE' not found"
  exit 1
fi

echo "Restoring $FILE to database $DB_NAME..."
gunzip < "$FILE" | docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME"
echo "Restore complete."
