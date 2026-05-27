#!/usr/bin/env bash
# Prints this Mac's LAN IP for physical iPhone Metro (Wi‑Fi dev).
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -z "$IP" ]; then
  echo "Could not detect LAN IP. Connect to Wi‑Fi and run: ipconfig getifaddr en0" >&2
  exit 1
fi
echo "$IP"
