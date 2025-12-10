SHELL := /bin/bash

.PHONY: e2e-setup e2e-parallel-setup e2e-run e2e-local e2e-parallel

# Configuration (override on the make command line if needed):
DB_NAME ?= footdash
DB_HOST ?= localhost
DB_PORT ?= 5432
DB_USER ?= postgres
DB_PASS ?= postgres
WORKERS ?= 4

e2e-setup:
	@echo "Preparing DB: $(DB_NAME) on $(DB_HOST):$(DB_PORT)"
	./scripts/create-test-db.sh --db $(DB_NAME) --host $(DB_HOST) --port $(DB_PORT) --user $(DB_USER) --pass $(DB_PASS)
	@echo "Running migrations..."
	cd backend && npm run migrate:run

e2e-parallel-setup:
	@echo "Preparing DBs for parallel runs: $(DB_NAME) with $(WORKERS) workers"
	./scripts/create-test-db.sh --db $(DB_NAME) --host $(DB_HOST) --port $(DB_PORT) --user $(DB_USER) --pass $(DB_PASS) --workers $(WORKERS)
	@echo "Running migrations against base DB"
	cd backend && npm run migrate:run

e2e-run:
	@echo "Running E2E tests (backend)..."
	cd backend && npm run test:e2e

e2e-local: e2e-setup e2e-run

e2e-parallel: e2e-parallel-setup
	@echo "Running E2E tests (backend) in parallel workers"
	cd backend && npm run test:e2e
