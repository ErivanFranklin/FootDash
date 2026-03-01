#!/bin/sh
# docker-entrypoint.sh
# Generates assets/config/app-config.json from environment variables at
# container start time, then launches nginx.
#
# Supported env vars (all optional — empty values are ignored):
#   API_BASE_URL    — e.g. https://api.footdash.example.com/api
#   WS_URL          — e.g. wss://api.footdash.example.com
#   AUTH_PATH        — e.g. /auth
#   PUSH_PUBLIC_KEY  — VAPID public key for web push

set -e

CONFIG_DIR="/usr/share/nginx/html/assets/config"
CONFIG_FILE="${CONFIG_DIR}/app-config.json"

mkdir -p "${CONFIG_DIR}"

cat > "${CONFIG_FILE}" <<EOF
{
  "apiBaseUrl": "${API_BASE_URL:-}",
  "wsUrl": "${WS_URL:-}",
  "authPath": "${AUTH_PATH:-}",
  "pushPublicKey": "${PUSH_PUBLIC_KEY:-}"
}
EOF

echo "[entrypoint] Generated ${CONFIG_FILE}"
cat "${CONFIG_FILE}"

exec nginx -g 'daemon off;'
