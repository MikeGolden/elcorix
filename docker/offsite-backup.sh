#!/bin/sh
# Entrypoint of the offsite-backup service in docker-compose.yml: once a
# day, copy ./backups (the nightly pg_dump files) into an encrypted restic
# repository off the host and drop snapshots older than OFFSITE_KEEP.
set -eu

: "${RESTIC_REPOSITORY:?set RESTIC_REPOSITORY in .env}"
: "${RESTIC_PASSWORD:?set RESTIC_PASSWORD in .env}"
KEEP="${OFFSITE_KEEP:-14d}"

# ssh rejects a key or config owned by another uid or readable by others;
# the bind mount keeps the host's ownership, so copy them in with strict
# modes (config, id_ed25519, known_hosts — see SECURITY.md).
if [ -d /ssh ] && [ -n "$(ls -A /ssh 2>/dev/null)" ]; then
	mkdir -p /root/.ssh
	chmod 700 /root/.ssh
	cp /ssh/* /root/.ssh/
	chmod 600 /root/.ssh/*
fi

# First run: create the repository. On an existing one `cat config`
# succeeds; if it fails for another reason, init fails too and the
# container restarts — visible in `docker compose logs offsite-backup`.
restic cat config >/dev/null 2>&1 || restic init

# Give the db-backup service time to write its first dump after a restart.
sleep 600

while true; do
	if restic backup --host elcorix --tag pg_dump /backups &&
		restic forget --host elcorix --keep-within "$KEEP" --prune &&
		restic check; then
		echo "offsite backup OK $(date -u +%FT%TZ)"
	else
		echo "offsite backup FAILED $(date -u +%FT%TZ)" >&2
	fi
	sleep 86400
done
