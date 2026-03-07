#!/bin/bash

# FootDash auth smoke check
# Validates that expected local users can log in via the frontend proxy URL.

set -euo pipefail
set +H

BASE_URL="${1:-http://localhost:4200}"
PASSWORD="${2:-${AUTH_CHECK_PASSWORD:-Password123!}}"
LOGIN_URL="${BASE_URL%/}/api/auth/login"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
AUTO_HEAL="${AUTH_CHECK_AUTO_HEAL:-true}"

USERS=(
  "erivanf10@gmail.com"
  "test01@test.com"
  "local+test@example.com"
  "demo.pro@footdash.com"
  "demo.user@footdash.com"
)

echo "Auth healthcheck"
echo "  URL:      ${LOGIN_URL}"
echo "  Password: ${PASSWORD}"
echo ""

failures=0

run_checks() {
  failures=0
  for email in "${USERS[@]}"; do
  body_file="/tmp/footdash-login-check-$(date +%s)-$RANDOM.json"
  status_code=$(curl -s -o "$body_file" -w "%{http_code}" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}" \
    "$LOGIN_URL")

  if [ "$status_code" = "201" ] || [ "$status_code" = "200" ]; then
    printf "[PASS] %-28s -> %s\n" "$email" "$status_code"
  else
    message=$(grep -o '"message"[[:space:]]*:[[:space:]]*"[^"]*"' "$body_file" | head -n1 | sed -E 's/^"message"[[:space:]]*:[[:space:]]*"(.*)"$/\1/')
    if [ -z "$message" ]; then
      message="(no message in response body)"
    fi
    printf "[FAIL] %-28s -> %s (%s)\n" "$email" "$status_code" "$message"
    failures=$((failures + 1))
  fi

  rm -f "$body_file"
  done
}

run_checks

if [ "$failures" -gt 0 ] && [ "$AUTO_HEAL" = "true" ]; then
  echo ""
  echo "Detected login failures. Attempting self-heal via seed..."
  (
    cd "$PROJECT_ROOT/backend"
    npm run seed:dev
  ) || true

  echo ""
  echo "Re-running auth checks after self-heal..."
  run_checks
fi

echo ""
if [ "$failures" -gt 0 ]; then
  echo "Result: ${failures} login check(s) failed."
  exit 1
fi

echo "Result: all login checks passed."
