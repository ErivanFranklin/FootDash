#!/usr/bin/env bash
# Create Postgres test database (idempotent)
# Usage: ./scripts/create-test-db.sh [options]
#
# Options:
#   --db NAME         Base database name (default: footdash)
#   --host HOST       Postgres host (default: localhost)
#   --port PORT       Postgres port (default: 5432)
#   --user USER       Postgres user (default: postgres)
#   --pass PASSWORD   Postgres password (default: postgres)
#   --workers N       Create per-worker DBs: <db>_worker_1 .. <db>_worker_N
#   --worker-id ID    Create/ensure a specific worker DB: <db>_worker_ID
#   --help            Show this help and exit
#
# Behavior:
# - Idempotent: will not fail if DB already exists.
# - If JEST_WORKER_ID env var is set and --worker-id is not provided, it will create the DB for that worker.

set -euo pipefail

DB_NAME="footdash"
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="postgres"
DB_PASS="postgres"
WORKERS=0
WORKER_ID=""

print_help() {
  sed -n '1,200p' "$0" | sed -n '1,120p'
}

while [[ $# -gt 0 ]]; do
  case $1 in
    --db)
      DB_NAME="$2"
      shift 2
      ;;
    --host)
      DB_HOST="$2"
      shift 2
      ;;
    --port)
      DB_PORT="$2"
      shift 2
      ;;
    --user)
      DB_USER="$2"
      shift 2
      ;;
    --pass)
      DB_PASS="$2"
      shift 2
      ;;
    --workers)
      WORKERS="$2"
      shift 2
      ;;
    --worker-id)
      WORKER_ID="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--db NAME] [--host HOST] [--port PORT] [--user USER] [--pass PASSWORD] [--workers N] [--worker-id ID]"
      echo
      echo "Creates the specified Postgres database(s) if they do not already exist."
      echo
      echo "When --workers N is provided, this will create:"
      echo "  <db> (base) and <db>_worker_1 ... <db>_worker_N"
      echo
      echo "When invoked inside a Jest worker you can set JEST_WORKER_ID to create only the worker DB."
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      echo "Run --help for usage"
      exit 1
      ;;
  esac
done

export PGPASSWORD="$DB_PASS"

psql_cmd() {
  psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -tc "$1"
}

ensure_connection() {
  if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "ERROR: Cannot connect to Postgres at $DB_HOST:$DB_PORT as $DB_USER"
    exit 1
  fi
}

create_db_if_missing() {
  local name="$1"
  # Query returns '1' if exists
  if psql_cmd "SELECT 1 FROM pg_database WHERE datname = '$name'" | grep -q 1; then
    echo "Database '$name' already exists."
  else
    echo "Creating database '$name'..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$name\";"
    echo "Database '$name' created."
  fi
}

ensure_connection

# If a specific worker id was passed, create only that worker DB
if [[ -n "$WORKER_ID" ]]; then
  create_db_if_missing "${DB_NAME}_worker_${WORKER_ID}"
  echo "Done. Worker DB: ${DB_NAME}_worker_${WORKER_ID}"
  exit 0
fi

# If JEST_WORKER_ID env var is set and no workers flag was provided, create the single worker DB
if [[ -n "${JEST_WORKER_ID:-}" && "$WORKERS" -eq 0 ]]; then
  create_db_if_missing "${DB_NAME}_worker_${JEST_WORKER_ID}"
  echo "Done. Worker DB: ${DB_NAME}_worker_${JEST_WORKER_ID}"
  exit 0
fi

# If --workers N was provided, create base DB and N worker DBs
if [[ "$WORKERS" -gt 0 ]]; then
  create_db_if_missing "$DB_NAME"
  i=1
  while [[ $i -le $WORKERS ]]; do
    create_db_if_missing "${DB_NAME}_worker_${i}"
    i=$((i+1))
  done
  echo "Done. Created base DB and $WORKERS worker DBs."
  exit 0
fi

# Default: create single base DB
create_db_if_missing "$DB_NAME"
echo "Done. Base DB: $DB_NAME"

