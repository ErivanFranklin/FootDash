#!/usr/bin/env bash
# Helper to build and run a local CI container for debugging frontend/backend CI issues.
# Usage: ./scripts/run-local-ci.sh [frontend|backend|all]

set -euo pipefail
MODE=${1:-all}
IMAGE_TAG=footdash-ci:latest

echo "Building CI image..."
docker build -t ${IMAGE_TAG} -f scripts/ci/Dockerfile .

case "$MODE" in
  frontend)
    echo "Running frontend tests inside container..."
    docker run --rm -v "$(pwd)":/workspace -w /workspace/frontend -e CI=true -e CHROME_BIN=/usr/bin/chromium ${IMAGE_TAG} bash -lc "npm ci && npm run lint && npm test -- --watch=false && npm run build"
    ;;
  backend)
    echo "Running backend tests inside container..."
    docker run --rm -v "$(pwd)":/workspace -w /workspace/backend -e CI=true ${IMAGE_TAG} bash -lc "npm ci && npm run lint && npm run migrate:run || true && npm test --silent"
    ;;
  all)
    echo "Running both frontend and backend tests"
    ./scripts/run-local-ci.sh frontend
    ./scripts/run-local-ci.sh backend
    ;;
  *)
    echo "Unknown mode: $MODE"
    exit 2
    ;;
esac
