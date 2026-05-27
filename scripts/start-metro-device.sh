#!/usr/bin/env bash
set -eo pipefail
cd "$(dirname "$0")/.."

IP="$(bash scripts/metro-lan-host.sh)"
HOST="$(scutil --get LocalHostName 2>/dev/null || hostname -s)"
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"

# Free port 8081 so the phone always uses a single bundler URL.
if lsof -ti:8081 >/dev/null 2>&1; then
  echo "Stopping existing Metro on port 8081..."
  lsof -ti:8081 | xargs kill 2>/dev/null || true
  sleep 1
fi

echo ""
echo "  1. Start this FIRST, then open WildKind on your phone."
echo "  2. Tap Recently opened → WildKind (one tap, no typing)."
echo "     Or Development servers if it appears."
echo ""
echo "  URL if needed: http://${IP}:8081"
echo "  Try hostname:  http://${HOST}.local:8081"
echo ""

exec npx expo start --lan --port 8081
