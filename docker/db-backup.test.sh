#!/bin/sh
# Tests for docker/db-backup.sh with stubbed pg_dump / pg_restore / psql.
# No database needed:   sh docker/db-backup.test.sh
set -u

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/db-backup.sh"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
failures=0

# Stubs read their behaviour from files, so each case can set it.
mkdir -p "$WORK/bin"
cat >"$WORK/bin/pg_dump" <<'STUB'
#!/bin/sh
# pg_dump -d <db> -Fc -f <file>
while [ $# -gt 0 ]; do case "$1" in -f) out="$2"; shift ;; esac; shift; done
: >"$out"                               # pg_dump creates the file first
case "$(cat "$STUBS/pg_dump")" in
	ok) printf 'PGDMP fake dump' >"$out" ;;
	empty) ;;                           # exits 0 but wrote nothing
	fail) exit 1 ;;
esac
STUB
cat >"$WORK/bin/pg_restore" <<'STUB'
#!/bin/sh
[ "$(cat "$STUBS/pg_restore")" = "ok" ]
STUB
cat >"$WORK/bin/psql" <<'STUB'
#!/bin/sh
cat "$STUBS/psql"
STUB
chmod +x "$WORK/bin/"*

run_case() { # <pg_dump> <pg_restore> <umami?> -> sets $code, $err
	echo "$1" >"$WORK/stubs/pg_dump"
	echo "$2" >"$WORK/stubs/pg_restore"
	printf '%s' "$3" >"$WORK/stubs/psql"
	PATH="$WORK/bin:$PATH" STUBS="$WORK/stubs" BACKUP_ONCE=1 BACKUP_DIR="$WORK/backups" \
		sh "$SCRIPT" >"$WORK/out" 2>"$WORK/err"
	code=$?
	err="$(cat "$WORK/err")"
}

check() { # <description> <condition...>
	desc="$1"
	shift
	if "$@"; then echo "ok   - $desc"; else echo "FAIL - $desc"; failures=$((failures + 1)); fi
}

count() { find "$WORK/backups" -type f -name "$1" | wc -l | tr -d ' '; }

fresh() {
	rm -rf "$WORK/backups" "$WORK/stubs"
	mkdir -p "$WORK/backups" "$WORK/stubs"
}

# 1. A good dump lands under its final name, nothing partial is left.
fresh
run_case ok ok ""
check "good dump exits 0" [ "$code" -eq 0 ]
check "good dump is kept as .dump" [ "$(count 'kosmetic-*.dump')" -eq 1 ]
check "no .partial left behind" [ "$(count '*.partial')" -eq 0 ]

# 2. pg_dump fails: no empty file, FAILED on stderr, non-zero exit.
fresh
run_case fail ok ""
check "failed pg_dump exits non-zero" [ "$code" -ne 0 ]
check "failed pg_dump leaves no file" [ "$(count '*')" -eq 0 ]
check "failed pg_dump says FAILED" sh -c "echo '$err' | grep -q FAILED"

# 3. pg_dump exits 0 but the file is empty.
fresh
run_case empty ok ""
check "empty dump exits non-zero" [ "$code" -ne 0 ]
check "empty dump is not kept" [ "$(count 'kosmetic-*')" -eq 0 ]

# 4. pg_restore cannot read the dump.
fresh
run_case ok fail ""
check "unreadable dump exits non-zero" [ "$code" -ne 0 ]
check "unreadable dump is not kept" [ "$(count 'kosmetic-*')" -eq 0 ]

# 5. A failed night does not rotate old dumps away.
fresh
touch -t 202001010000 "$WORK/backups/kosmetic-20200101-000000.dump"
echo data >"$WORK/backups/kosmetic-20200101-000000.dump"
touch -t 202001010000 "$WORK/backups/kosmetic-20200101-000000.dump"
run_case fail ok ""
check "old dump survives a failed night" [ -f "$WORK/backups/kosmetic-20200101-000000.dump" ]

# 6. ...but a good night rotates it.
run_case ok ok ""
check "old dump is rotated after a good night" [ ! -f "$WORK/backups/kosmetic-20200101-000000.dump" ]
check "the new dump stays" [ "$(count 'kosmetic-*.dump')" -eq 1 ]

# 7. Empty dumps from the old one-liner are cleaned up.
fresh
: >"$WORK/backups/kosmetic-20260918-183424.dump"
run_case ok ok ""
check "zero-byte legacy dump is removed" [ ! -f "$WORK/backups/kosmetic-20260918-183424.dump" ]

# 8. Umami is dumped when its database exists.
fresh
run_case ok ok "1"
check "umami dump written when the database exists" [ "$(count 'umami-*.dump')" -eq 1 ]
fresh
run_case ok ok ""
check "no umami dump without the database" [ "$(count 'umami-*')" -eq 0 ]

if [ "$failures" -ne 0 ]; then
	echo "$failures check(s) failed"
	exit 1
fi
echo "all db-backup checks passed"
