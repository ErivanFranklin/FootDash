# CI Troubleshooting and Developer Guide

This document covers how the CI pipelines work for FootDash and common troubleshooting steps when frontend or backend CI jobs fail.

## Workflows
- `.github/workflows/backend-ci.yml` — Runs backend tests, starts a Postgres service, applies migrations and runs Jest.
- `.github/workflows/frontend-ci.yml` — Runs frontend lint, Karma tests and Angular build.

Both workflows run on pushes to `main` and branches matching `migration/**`, and PRs that affect the respective directories.

## Running CI locally
- Backend:
  - Start a local Postgres (Docker):
    ```bash
    docker compose -f docker-compose.postgres.yml up -d
    ```
  - Run migrations:
    ```bash
    cd backend-nest
    npm install
    npm run migrate:run
    npm test
    ```

- Frontend:
  - Install deps and run tests locally:
    ```bash
    cd frontend
    npm install
    npm run lint
    npm test -- --watch=false
    npm run build
    ```

## Common CI failures and fixes

### Frontend: Karma tests fail in CI (Chrome not found)
Symptoms:
- Errors mentioning Chrome or `No binary for Chromium` or `No usable browser`.

Fixes:
1. Ensure the workflow installs a headless browser. We install `chromium-browser` in `frontend-ci.yml` and set `CHROME_BIN=/usr/bin/chromium-browser`.
2. If your distribution uses a different binary path (e.g., `/usr/bin/chromium`), update the workflow to set `CHROME_BIN` accordingly.
3. If Karma still fails, check `frontend/karma.conf.js` — the CI uses a `ChromeHeadlessNoSandbox` custom launcher with `--no-sandbox` and `--disable-dev-shm-usage` flags for stability.

### Frontend: Tests time out or hang
- Ensure `singleRun` is enabled in CI (karma.conf reads `process.env.CI`).
- Use `npm test -- --watch=false` to avoid watch mode.
- Increase Karma/Jest timeouts in the test config if necessary.

### Backend: Postgres connection issues in CI
Symptoms:
- `pg_isready` failing or TypeORM cannot connect to DB.

Fixes:
1. The workflow uses a Postgres service container and waits for it to be ready using `pg_isready`. If the health check fails, extend the wait loop in the workflow or increase service health retries.
2. Check `backend-nest/data-source.ts` — CI runs migrations using env vars set in the workflow. Ensure `DATABASE_URL` or `DB_*` env vars match the workflow values.

### Migrations not applied
- Ensure `npm ci` runs successfully and `ts-node` is available (it's in devDependencies). The workflow runs `npm run migrate:run` which executes `scripts/run-migrations.ts` using ts-node register.
- For stricter CI, consider compiling TypeScript migrations ahead of time and running compiled JS in CI.

## Useful local troubleshooting commands
- Run only backend tests:
```bash
cd backend-nest
npm ci
npm run test
```

- Run migrations locally against docker Postgres:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/footdash npm run migrate:run --prefix backend-nest
```

- Run frontend tests headless locally (ensure Chrome installed):
```bash
cd frontend
CHROME_BIN=$(which chromium-browser || which chromium) npm test -- --watch=false
```

## Contact / next steps
If CI continues to fail, paste the job log and I'll help triage the exact failure and propose a targeted fix (e.g., changing Karma flags, adjusting timeouts, or installing missing system packages).
