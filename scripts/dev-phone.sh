#!/usr/bin/env bash
# One command: Metro on Wi-Fi + install/open on Duke iPhone.
set -eo pipefail
cd "$(dirname "$0")/.."

DEVICE_ID="00008120-000C45602140C01E"
IP="$(bash scripts/metro-lan-host.sh)"
export REACT_NATIVE_PACKAGER_HOSTNAME="$IP"

for port in 8081 8082; do
  if lsof -ti:"${port}" >/dev/null 2>&1; then
    echo "Stopping old Metro on port ${port}..."
    lsof -ti:"${port}" | xargs kill 2>/dev/null || true
  fi
done
sleep 1

echo ""
echo "  Unlock Duke 2 iPhone (same Wi‑Fi as this Mac)."
echo "  Bundler: http://${IP}:8081"
echo ""

exec npx expo run:ios --device "$DEVICE_ID"
