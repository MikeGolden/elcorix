#!/bin/sh
# Delete Docker json-file log entries older than LOG_RETENTION_DAYS (default 7).
#
# The privacy policy (Stand 17.09.2026, § 3) promises that server log data —
# visitor IPs in nginx's and the API's request logs — is deleted after seven
# days at the latest. Docker only rotates logs by size, so this runs daily
# from the log-retention service in docker-compose.yml.
#
#   usage: prune-logs.sh <docker containers dir>   (e.g. /var/lib/docker/containers)
#
# Each json-file line ends in "time":"<RFC 3339 UTC>"}; ISO timestamps sort
# lexically, so a string comparison against the cutoff is enough.
set -eu

dir="${1:?usage: prune-logs.sh <containers dir>}"
days="${LOG_RETENTION_DAYS:-7}"
case "$days" in ''|*[!0-9]*) echo "prune-logs: invalid LOG_RETENTION_DAYS '$days'" >&2; exit 1 ;; esac

now="$(date -u +%s)"
cutoff="$(date -u -d "@$((now - days * 86400))" +%Y-%m-%dT%H:%M:%S)"

# Rotated files (<id>-json.log.1, .2, …) are never written again: once the
# file is older than the window, every line in it is.
find "$dir" -type f -name '*-json.log.*' -mmin "+$((days * 1440))" -exec rm -f {} +

# The live file: keep lines at or after the cutoff and write them back in
# place. Truncating instead of replacing keeps the inode dockerd appends to.
for log in "$dir"/*/*-json.log; do
  [ -f "$log" ] || continue
  tmp="$log.prune"
  awk -v cutoff="$cutoff" '
    match($0, /"time":"[^"]+"/) {
      if (substr($0, RSTART + 8, 19) < cutoff) next
    }
    { print }
  ' "$log" > "$tmp"
  if ! cmp -s "$log" "$tmp"; then
    cat "$tmp" > "$log"
  fi
  rm -f "$tmp"
done
