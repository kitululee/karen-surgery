#!/usr/bin/env bash
# Karen Surgery — Automated Database & Media Uploads Backup Script
# Schedule via cron (example daily at 02:15 EAT):
#   15 2 * * * /usr/local/bin/karen-surgery-backup.sh >> /var/log/karen-surgery-backup.log 2>&1

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/var/backups/karen-surgery}"
ENV_FILE="${ENV_FILE:-/etc/karen-surgery/api.env}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a && source "$ENV_FILE" && set +a
fi

mkdir -p "$BACKUP_ROOT/db" "$BACKUP_ROOT/uploads"
chmod 700 "$BACKUP_ROOT"

echo "[$STAMP] Starting Karen Surgery backup..."

if [[ -n "${DATABASE_URL:-}" ]]; then
  OUT_FILE="$BACKUP_ROOT/db/karen-surgery-pg-${STAMP}.sql.gz"
  pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > "$OUT_FILE"
  chmod 600 "$OUT_FILE"
  echo "[$STAMP] PostgreSQL backup written: $OUT_FILE"
else
  SQLITE_FILE="${SQLITE_PATH:-/var/lib/karen-surgery/karen-surgery.sqlite}"
  if [[ ! -f "$SQLITE_FILE" ]]; then
    echo "[$STAMP] ERROR: SQLite database not found at $SQLITE_FILE" >&2
    exit 1
  fi
  OUT_FILE="$BACKUP_ROOT/db/karen-surgery-sqlite-${STAMP}.sqlite"
  sqlite3 "$SQLITE_FILE" ".backup '$OUT_FILE'"
  gzip -9 "$OUT_FILE"
  chmod 600 "${OUT_FILE}.gz"
  echo "[$STAMP] SQLite backup written: ${OUT_FILE}.gz"
fi

UPLOAD_SRC="${UPLOAD_DIR:-/var/www/karen-surgery-api/uploads}"
if [[ -d "$UPLOAD_SRC" ]]; then
  MEDIA_ARCHIVE="$BACKUP_ROOT/uploads/karen-surgery-uploads-${STAMP}.tar.gz"
  tar -czf "$MEDIA_ARCHIVE" -C "$UPLOAD_SRC" .
  chmod 600 "$MEDIA_ARCHIVE"
  echo "[$STAMP] Uploads archive written: $MEDIA_ARCHIVE"
fi

# Prune backups older than RETENTION_DAYS
find "$BACKUP_ROOT/db" -type f -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_ROOT/uploads" -type f -mtime +"$RETENTION_DAYS" -delete

echo "[$STAMP] Backup complete (retention: ${RETENTION_DAYS} days)."
