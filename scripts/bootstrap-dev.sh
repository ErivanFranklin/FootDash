#!/usr/bin/env bash
set -euo pipefail

# Lightweight bootstrap for local dev (no Docker)
# - Installs dependencies for backend and frontend
# - Starts backend (npm run dev) and frontend (ionic/ng serve) in background
# - Writes logs to ./logs and PIDs to ./.pids
# Usage: ./scripts/bootstrap-dev.sh [--fast]
#   --fast    Skip installing dependencies (use existing node_modules). Much faster.

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
PIDS_DIR="$ROOT_DIR/.pids"


mkdir -p "$LOG_DIR" "$PIDS_DIR"

# parse args
FAST_MODE=false
START_DB=true
for arg in "$@"; do
  case "$arg" in
    --fast) FAST_MODE=true ;;
    --no-db) START_DB=false ;;
    -h|--help) echo "Usage: $0 [--fast] [--no-db]"; exit 0 ;;
  esac
done

# Try to use nvm if available and ensure Node 20 (best for Angular/Ionic)
if command -v nvm >/dev/null 2>&1; then
  # shellcheck disable=SC1090
  source "$(dirname "$(command -v nvm)")/../nvm.sh" || true
fi

# If nvm is installed, switch to node 20; otherwise rely on system node
if command -v nvm >/dev/null 2>&1; then
  echo "Using nvm -> ensuring Node 20 is active"
  nvm install 20 >/dev/null || true
  nvm use 20 >/dev/null || true
else
  echo "nvm not found; using system Node ($(node -v 2>/dev/null || echo 'none'))"
fi

# echo starting message
echo "[bootstrap] Starting backend and frontend. fast_mode=$FAST_MODE"

# If requested, start Colima and DB compose before installing/building
DB_COMPOSE_FILE="$ROOT_DIR/docker-compose.db.yml"
if [ "$START_DB" = true ]; then
  if [ -f "$DB_COMPOSE_FILE" ]; then
    echo "[bootstrap] Starting DB via Colima/docker-compose ($DB_COMPOSE_FILE)"
    # start colima if available
    if command -v colima >/dev/null 2>&1; then
      echo "[bootstrap] Starting Colima VM (if not running)"
      colima start --cpu 2 --memory 4 >/dev/null 2>&1 || true
    else
      echo "[bootstrap] Colima not found; attempting to use docker directly"
    fi

    if command -v docker >/dev/null 2>&1; then
      if docker compose -f "$DB_COMPOSE_FILE" version >/dev/null 2>&1; then
        if ! docker compose -f "$DB_COMPOSE_FILE" up -d; then
          echo "[bootstrap] Warning: docker compose failed to start DB; continuing without DB"
        else
          echo "[bootstrap] DB started (docker compose)."
        fi
      else
        if ! docker-compose -f "$DB_COMPOSE_FILE" up -d; then
          echo "[bootstrap] Warning: docker-compose failed to start DB; continuing without DB"
        else
          echo "[bootstrap] DB started (docker-compose)."
        fi
      fi
    else
      echo "[bootstrap] Docker CLI not available; skipping DB startup."
    fi
  else
    echo "[bootstrap] DB compose file not found at $DB_COMPOSE_FILE; skipping DB startup"
  fi
else
  echo "[bootstrap] --no-db supplied; skipping DB startup"
fi

# Install deps (parallel where possible) unless fast mode
if [ "$FAST_MODE" = false ]; then
  echo "[bootstrap] Installing backend and frontend dependencies (parallel)..."
  (
    cd "$ROOT_DIR/backend" && \
      if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --silent; \
      else npm ci --prefer-offline --no-audit --no-fund --silent; fi
  ) &
  BACKEND_INSTALL_PID=$!

  (
    cd "$ROOT_DIR/frontend" && \
      if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --silent; \
      else npm ci --prefer-offline --no-audit --no-fund --silent; fi
  ) &
  FRONTEND_INSTALL_PID=$!

  # wait for installs to finish
  wait $BACKEND_INSTALL_PID || { echo "Backend install failed"; exit 1; }
  wait $FRONTEND_INSTALL_PID || { echo "Frontend install failed"; exit 1; }
else
  echo "[bootstrap] --fast supplied; skipping dependency installation"
fi

# Start backend
(
  echo "[bootstrap] Starting backend (npm run dev)"
  cd "$ROOT_DIR/backend"
  nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 &
  echo $! > "$PIDS_DIR/backend.pid"
  echo "[bootstrap] backend PID $(cat $PIDS_DIR/backend.pid) -> logs/backend.log"
) || { echo "Failed starting backend"; exit 1; }

# Start frontend (attempt Ionic, fallback to Angular CLI)
(
  echo "[bootstrap] Starting frontend (dev server)"
  cd "$ROOT_DIR/frontend"

  # prefer ionic if available in local node_modules or globally via npx
  if npx --no-install ionic --version >/dev/null 2>&1 2>/dev/null; then
    echo "[bootstrap] Starting frontend with Ionic serve"
    nohup npx ionic serve --host=0.0.0.0 --port=8100 > "$LOG_DIR/frontend.log" 2>&1 &
  else
    echo "[bootstrap] Ionic not available, falling back to ng serve"
    nohup npx ng serve --host 0.0.0.0 --port=4200 > "$LOG_DIR/frontend.log" 2>&1 &
  fi
  echo $! > "$PIDS_DIR/frontend.pid"
  echo "[bootstrap] frontend PID $(cat $PIDS_DIR/frontend.pid) -> logs/frontend.log"
) || { echo "Failed starting frontend"; exit 1; }

cat <<EOF
Bootstrap complete.
- Backend logs: $LOG_DIR/backend.log (PID: $(cat "$PIDS_DIR/backend.pid"))
- Frontend logs: $LOG_DIR/frontend.log (PID: $(cat "$PIDS_DIR/frontend.pid"))

To stop the processes:
  kill \\$(cat "$PIDS_DIR/backend.pid") || true
  kill \\$(cat "$PIDS_DIR/frontend.pid") || true

To follow logs:
  tail -f $LOG_DIR/backend.log $LOG_DIR/frontend.log
EOF
