#!/usr/bin/env bash
set -euo pipefail

# Start Colima (if installed) and bring up only the DB service via docker-compose
# Usage: ./scripts/start-db.sh [--no-colima-start]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/docker-compose.db.yml"

ARG1=${1:-}
if [ "$ARG1" = "--no-colima-start" ] 2>/dev/null; then
  SKIP_COLIMA=1
else
  SKIP_COLIMA=0
fi

if [ "$SKIP_COLIMA" -eq 0 ]; then
  if command -v colima >/dev/null 2>&1; then
    echo "Starting Colima VM..."
    colima start --cpu 2 --memory 4
  else
    echo "Colima is not installed. Please install Colima to use this script (https://github.com/abiosoft/colima)"
    exit 1
  fi
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker CLI not found in PATH after Colima start. Ensure docker/colima is configured." >&2
  exit 1
fi

echo "Bringing up DB via docker-compose: $COMPOSE_FILE"
# Use docker compose (v2) if available
if docker compose version >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" up -d
else
  docker-compose -f "$COMPOSE_FILE" up -d
fi

echo "DB should be available on localhost:5432 (or host.docker.internal from inside containers)."

cat <<EOF
Commands:
  docker compose -f $COMPOSE_FILE ps
  docker compose -f $COMPOSE_FILE logs -f db

To stop:
  docker compose -f $COMPOSE_FILE down
EOF
