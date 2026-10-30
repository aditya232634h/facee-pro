# Backup & restore (MongoDB Database Tools)

Install: <https://www.mongodb.com/docs/database-tools/installation/> (`mongodump`, `mongorestore`) and `mongosh`.

```bash
export MONGODB_URI='mongodb+srv://<user>:<password>@<cluster>/parkease?retryWrites=true&w=majority'   # single quotes!
./database/backup/backup.sh                                           # -> database/backup/dumps/parkease-<UTC stamp>.archive.gz
export DB_NAME=parkease
./database/backup/restore-test.sh database/backup/dumps/parkease-<stamp>.archive.gz   # restores into parkease_restore_test and compares counts
```
**Disaster recovery** (replace the live DB): `mongorestore --uri="$MONGODB_URI" --gzip --archive=<file> --drop` — this overwrites existing collections; take a fresh backup first.

**Notes**
- Always single-quote the URI so `&`, `?` and `$` are not interpreted by the shell. Passwords with special characters must be URL-encoded.
- Credentials come only from the environment. `dumps/` is git-ignored; never commit dumps (they contain user data and password hashes) or `.env` files.
- Retention suggestion: daily backups, keep 14 days locally plus a weekly copy for 8 weeks in separate, access-controlled storage. Test a restore regularly.
- A replica set protects against node failure, **not** against deletion/corruption: backups are still required.
- Atlas free (M0) clusters have no managed Cloud Backup, so scheduled `mongodump` as above is the backup strategy there.
- Status: `backup.sh` and the restore (into a scratch database, counts compared) were run in the build sandbox with matching counts. `restore-test.sh` itself needs `mongosh` for its count step, which was not available there; run it yourself.
