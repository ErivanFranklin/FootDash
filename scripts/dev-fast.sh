#!/usr/bin/env bash
set -euo pipefail

# Fast dev startup (no installs, no DB). Assumes node_modules already present.
# Usage: ./scripts/dev-fast.sh
# Optional args: --no-frontend --no-backend

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SKIP_FRONTEND=0
SKIP_BACKEND=0
for arg in "$@"; do
  case "$arg" in
    --no-frontend) SKIP_FRONTEND=1 ;;
    --no-backend) SKIP_BACKEND=1 ;;
    -h|--help) echo "Usage: $0 [--no-frontend] [--no-backend]"; exit 0 ;;
  esac
done

# prefer nvm Node 20 if available
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1090
  . "$NVM_DIR/nvm.sh"
  nvm use 20 >/dev/null 2>&1 || nvm install 20 >/dev/null 2>&1 && nvm use 20 >/dev/null 2>&1 || true
  export PATH="$NVM_DIR/versions/node/$(nvm version)/bin:$PATH"
fi

mkdir -p "$ROOT_DIR/logs" "$ROOT_DIR/.pids"

if [ "$SKIP_BACKEND" -eq 0 ]; then
  (
    echo "[dev-fast] Starting backend (nodemon)"
    cd "$ROOT_DIR/backend"
    # starts backend with nodemon if available, otherwise node
    if command -v npx >/dev/null 2>&1 && npx --no-install nodemon --version >/dev/null 2>&1; then
      nohup npx nodemon index.js > "$ROOT_DIR/logs/backend.log" 2>&1 &
    else
      nohup node index.js > "$ROOT_DIR/logs/backend.log" 2>&1 &
    fi
    echo $! > "$ROOT_DIR/.pids/backend.pid"
    echo "[dev-fast] backend PID $(cat $ROOT_DIR/.pids/backend.pid) -> logs/backend.log"
  ) &
fi

if [ "$SKIP_FRONTEND" -eq 0 ]; then
  (
    echo "[dev-fast] Starting frontend (ng serve)"
    cd "$ROOT_DIR/frontend"
    nohup npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json > "$ROOT_DIR/logs/frontend.log" 2>&1 &
    echo $! > "$ROOT_DIR/.pids/frontend.pid"
    echo "[dev-fast] frontend PID $(cat $ROOT_DIR/.pids/frontend.pid) -> logs/frontend.log"
  ) &
fi

wait 1 || true

cat <<EOF
Dev-fast launched.
To follow logs: tail -f logs/backend.log logs/frontend.log
To stop: kill \\$(cat ./.pids/backend.pid) || true; kill \\$(cat ./.pids/frontend.pid) || true
EOF
