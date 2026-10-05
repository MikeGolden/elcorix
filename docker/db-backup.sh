#!/bin/sh
# Entrypoint of the db-backup service in docker-compose.yml: a nightly
# pg_dump of the customer database (and of Umami's, when it exists) into
# /backups, keeping BACKUP_KEEP_DAYS days of dumps.
#
# Why this is a script and not a one-liner any more: `pg_dump -f x.dump`
# creates the file before it connects, so every failed night used to leave
# an empty .dump next to the good ones — three of them in a local ./backups
# by 2026-10-05 — and nothing said so. Now a dump is written to
# `<name>.partial`, checked, and only then renamed; a failure deletes the
# partial file, says FAILED on stderr and retries in an hour. Old dumps are
# rotated only after a good one has landed, so a week of failures can
# never rotate away the last good dump.
#
# Connection comes from the libpq environment (PGHOST, PGUSER, PGPASSWORD).
# BACKUP_ONCE=1 runs a single round and exits with its status (the test,
# docker/db-backup.test.sh, uses it).
set -u

DIR="${BACKUP_DIR:-/backups}"
KEEP="${BACKUP_KEEP_DAYS:-14}"
RETRY_SECONDS="${BACKUP_RETRY_SECONDS:-3600}"

log() { echo "db-backup $(date -u +%FT%TZ) $*"; }
fail() { echo "db-backup $(date -u +%FT%TZ) FAILED: $*" >&2; }

# dump <file prefix> <database>
dump() {
	name="$1"
	db="$2"
	final="$DIR/$name-$(date +%Y%m%d-%H%M%S).dump"
	partial="$final.partial"
	if ! pg_dump -d "$db" -Fc -f "$partial"; then
		rm -f "$partial"
		fail "pg_dump of $db exited non-zero — older dumps kept"
		return 1
	fi
	if [ ! -s "$partial" ] || ! pg_restore --list "$partial" >/dev/null 2>&1; then
		rm -f "$partial"
		fail "dump of $db is empty or unreadable by pg_restore — older dumps kept"
		return 1
	fi
	mv "$partial" "$final"
	find "$DIR" -name "$name-*.dump" -mtime +"$KEEP" -delete
	log "OK $final ($(wc -c <"$final" | tr -d ' ') bytes)"
}

round() {
	status=0
	# Leftovers that can never be restored: a .partial from a container
	# killed mid-dump, and the empty dumps the old one-liner left behind.
	find "$DIR" -name "*.dump.partial" -mmin +60 -delete
	find "$DIR" -name "*.dump" -size 0 -delete

	dump kosmetic "${PGDATABASE:-kosmetic}" || status=1
	has_umami="$(psql -d "${PGDATABASE:-kosmetic}" -tAc "SELECT 1 FROM pg_database WHERE datname = 'umami'" 2>/dev/null)"
	if [ "$has_umami" = "1" ]; then
		dump umami umami || status=1
	fi
	return "$status"
}

if [ "${BACKUP_ONCE:-}" = "1" ]; then
	round
	exit $?
fi

while true; do
	if round; then
		sleep 86400
	else
		fail "retrying in ${RETRY_SECONDS}s"
		sleep "$RETRY_SECONDS"
	fi
done
