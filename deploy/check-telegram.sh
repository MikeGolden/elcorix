#!/usr/bin/env bash
#
# Check the Telegram credentials themselves, from a machine that has network.
#
#   ./deploy/check-telegram.sh                 # reads .env.local
#   ./deploy/check-telegram.sh .env            # or another env file
#
# Answers the only question worth asking first: are the token and chat id in
# that file good? If they are, a silent form is a Cloudflare configuration
# problem, not a Telegram one. Nothing here prints the token.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
file="${1:-$root/.env.local}"

[ -f "$file" ] || { echo "No such env file: $file" >&2; exit 1; }

token="$(grep -E '^TELEGRAM_BOT_TOKEN=' "$file" | tail -1 | cut -d= -f2- | tr -d '"'"'"' \r')"
chat="$(grep -E '^TELEGRAM_CHAT_ID=' "$file" | tail -1 | cut -d= -f2- | tr -d '"'"'"' \r')"

[ -n "$token" ] || { echo "TELEGRAM_BOT_TOKEN is not set in $file" >&2; exit 1; }
[ -n "$chat" ]  || { echo "TELEGRAM_CHAT_ID is not set in $file" >&2; exit 1; }

echo "Chat id: $chat"
case "$chat" in
  -100*) echo "  shape: supergroup or channel" ;;
  -*)    echo "  shape: basic group — NOTE: this id changes to -100… if the group is upgraded to a supergroup" ;;
  @*)    echo "  shape: public channel username" ;;
  *)     echo "  shape: private chat with one user" ;;
esac

echo
echo "getMe (is the token valid?)"
curl -s --max-time 10 "https://api.telegram.org/bot$token/getMe" \
  | sed "s|$token|<token>|g"

echo
echo "getChat (can the bot see that chat?)"
curl -s --max-time 10 -X POST "https://api.telegram.org/bot$token/getChat" \
  -H 'Content-Type: application/json' -d "{\"chat_id\":\"$chat\"}" \
  | sed "s|$token|<token>|g"

echo
echo "sendMessage (the real thing — look for it in the chat)"
curl -s --max-time 10 -X POST "https://api.telegram.org/bot$token/sendMessage" \
  -H 'Content-Type: application/json' \
  -d "{\"chat_id\":\"$chat\",\"text\":\"elcorix: deployment check\"}" \
  | sed "s|$token|<token>|g"
echo
