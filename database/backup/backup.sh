#!/usr/bin/env bash
# Compressed single-file backup of the database named in MONGODB_URI. No credentials are stored in this script.
# Usage: export MONGODB_URI='mongodb+srv://user:pass@cluster/parkease?retryWrites=true&w=majority'; ./backup.sh
set -euo pipefail
: "${MONGODB_URI:?Set MONGODB_URI (the URI must include the database name)}"
OUT_DIR="${BACKUP_DIR:-$(cd "$(dirname "$0")" && pwd)/dumps}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/parkease-$(date -u +%Y%m%dT%H%M%SZ).archive.gz"
mongodump --uri="$MONGODB_URI" --archive="$FILE" --gzip
echo "Backup written: $FILE ($(du -h "$FILE" | cut -f1))"
# Retention: delete local backups older than RETENTION_DAYS (default 14)
find "$OUT_DIR" -name 'parkease-*.archive.gz' -mtime +"${RETENTION_DAYS:-14}" -delete
