#!/usr/bin/env bash
# Restores a backup into a SEPARATE database (<DB_NAME>_restore_test) and compares document counts. Never touches the source database.
# Usage: export MONGODB_URI='...'; export DB_NAME=parkease; ./restore-test.sh dumps/parkease-<stamp>.archive.gz
set -euo pipefail
: "${MONGODB_URI:?Set MONGODB_URI}"; : "${DB_NAME:?Set DB_NAME (source database name)}"
ARCHIVE="${1:?Usage: restore-test.sh <archive.gz>}"
TARGET="${DB_NAME}_restore_test"
mongorestore --uri="$MONGODB_URI" --gzip --archive="$ARCHIVE" --nsFrom="${DB_NAME}.*" --nsTo="${TARGET}.*" --drop
echo "Comparing document counts (source vs restored):"
mongosh "$MONGODB_URI" --quiet --eval "
for (const c of ['users','parkingslots','bookings','auditlogs']) {
  const a = db.getSiblingDB('$DB_NAME').getCollection(c).countDocuments({});
  const b = db.getSiblingDB('$TARGET').getCollection(c).countDocuments({});
  print(c.padEnd(14), 'source=' + a, 'restored=' + b, a === b ? 'OK' : 'MISMATCH (data changed since backup?)');
}"
echo "When satisfied, drop the test copy:  mongosh \"\$MONGODB_URI\" --eval \"db.getSiblingDB('$TARGET').dropDatabase()\""
