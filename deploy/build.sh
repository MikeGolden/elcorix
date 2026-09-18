#!/usr/bin/env bash
#
# Build the uploadable Cloudflare Pages folder.
#
#   ./deploy/build.sh          → deploy/cloudflare/
#
# The client is built straight into deploy/cloudflare (--emptyOutDir wipes it
# first, which is why the worker lives in deploy/worker/ and is copied in
# afterwards rather than being edited in place in the output).
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
out="$root/deploy/cloudflare"

# The booking block stays hidden (see client/src/features.ts); flip this to
# "true" to ship the Altegio section, /booking route and embed.
export VITE_ENABLE_ALTEGIO="${VITE_ENABLE_ALTEGIO:-false}"
export VITE_ALTEGIO_COMPANY_ID="${VITE_ALTEGIO_COMPANY_ID:-000000}"

cd "$root/client"
npx tsc --noEmit
npx vite build --outDir "$out" --emptyOutDir

cp "$root/deploy/worker/_worker.js" "$out/_worker.js"
find "$out" -name '.DS_Store' -delete

echo
echo "Built $out"
echo "Upload it:  npx wrangler pages deploy \"$out\" --project-name elcorix"
