# Local development (no Docker)

This file shows minimal, copy-paste commands to run the FootDash backend and frontend locally without Docker. Use this for fast development and lightweight production preview.

---
Prerequisites
- macOS (zsh)
- Node.js (v18+ / v20 recommended)
- npm
- Optional: nvm, pm2, serve/http-server

Install nvm (optional, recommended):
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
node -v
```

1) Start backend (NestJS, dev)
```bash
# from project root
cd /Users/erivansilva/Documents/FootDash/backend
npm ci

# copy the sample env if present or create one
# cp .env.example .env

# ensure mock mode is enabled for local dev without real API keys
# in .env set:
# FOOTBALL_API_MOCK=true

# development with auto-restart
npm run start:dev
# or use root helper script
# npm run --workspace-root start:dev:api
```
Notes:
- Swagger UI: http://localhost:3000/api (OpenAPI JSON at /api-json)
- Health check: http://localhost:3000/health
- If you see a 503 from team endpoints without real API creds, enable FOOTBALL_API_MOCK=true.

Football API configuration (dev)
- FOOTBALL_API_MOCK (boolean) — when true the backend will return deterministic mock data for team info, fixtures and stats so you can develop without real API credentials. Set in `.env`:

```ini
FOOTBALL_API_MOCK=true
```

- FOOTBALL_API_DEFAULT_LEAGUE (integer, optional) — when provided the server will use this league id as a default for endpoints that normally require `leagueId` (for example `GET /teams/:teamId/stats`). This lets clients omit `leagueId` in local workflows. Example:

```ini
FOOTBALL_API_DEFAULT_LEAGUE=999
```

Behavior summary:
- If `leagueId` is provided in the request it is used.
- If `leagueId` is omitted but `FOOTBALL_API_DEFAULT_LEAGUE` is set, the server will use that value.
- If neither is provided and `FOOTBALL_API_MOCK=true` the endpoint will still respond (mock ignores these params).
- If neither is provided and the server is not in mock mode, the endpoint will return HTTP 400.
- DB: For local DB via Colima, run `./scripts/start-db.sh` from project root first.

1a) Start legacy backend (if needed)
```bash
# from project root
cd /Users/erivansilva/Documents/FootDash/backend
npm ci
# copy the sample env file if you don't have one yet
cp .env.example .env
# edit .env to set a secure JWT_SECRET and any other overrides

# development with auto-restart
npm run dev
# or start once
# npm start
```
Notes:
- This legacy backend runs on port `4000` by default. Prefer the NestJS backend (`backend`) for new work.

2) Start frontend (dev server, live reload)
```bash
# from project root
cd /Users/erivansilva/Documents/FootDash/frontend
npm ci

# If this is an Ionic project (preferred for Ionic features):
npx ionic serve --host=0.0.0.0 --port=8100

# OR use Angular CLI directly:
# npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json
```
Use the project's `proxy.conf.json` so API calls to `/api` are proxied to the backend port (defaults to http://localhost:4000). Update `src/environments/*.ts` or `.env` values if you point the frontend at a different backend host.

If you need to track custom frontend API settings, copy `frontend/.env.example` to `frontend/.env` and keep the values aligned with `src/environments/environment*.ts`.
Run `node scripts/sync-frontend-env.mjs` whenever you update `.env` so the Angular environment files stay in sync automatically.

3) Quick production preview (static build + tiny static server)
```bash
cd /Users/erivansilva/Documents/FootDash/frontend
npm ci
# Build production bundle (adjust command if your package.json uses a different script)
npm run build

# Serve the build folder with `serve` (install if needed)
npm install -g serve
# Determine build output folder (commonly under dist/). Replace `dist/your-app` below.
serve -s dist/your-app -l 3000

# Alternatively, use http-server via npx
npx http-server dist/your-app -p 3000
```
Now static UI is at `http://localhost:3000`. Point client API base URLs to `http://localhost:3001` (the backend).

4) Run backend as a background process (pm2)
```bash
npm install -g pm2
cd /Users/erivansilva/Documents/FootDash/backend
pm ci
pm2 start index.js --name footdash-backend
pm2 logs footdash-backend
pm2 save
```

5) Helpful notes and troubleshooting
- If ports conflict, change `PORT` in `.env` for backend or change frontend serve port.
- If you get CORS errors when serving static build from `serve`, either:
  - Update frontend fetch base URL to `http://localhost:3001`, or
  - Enable CORS in backend (it appears `cors` is already a dependency).
- To stop dev servers: Ctrl+C in the terminal. To stop pm2: `pm2 stop footdash-backend`.

6) Automation (optional)
Add these scripts to a top-level `Makefile` or `package.json` scripts to make starting/stopping repeatable. Example `Makefile` targets:
```makefile
start-backend:
	cd backend && npm ci && npm run dev

start-frontend:
	cd frontend && npm ci && npx ionic serve --host=0.0.0.0 --port=8100
```

---
If you want, I can run the backend and frontend locally in this environment now, or add these scripts to the repo. Tell me which you prefer.

---
Running only the DB in a lightweight container (Colima + Docker Compose)

If Docker Desktop is too heavy and you only want a DB container running, you can use Colima (Lima-based lightweight VM) and a DB-only compose file we include.

1) Install Colima (if you don't have it):
```bash
# Homebrew (recommended)
brew install colima
brew install docker
```

2) Start the DB service (this will start Colima and run postgres in a container):
```bash
./scripts/start-db.sh
```
This uses `docker-compose.db.yml` in the project root and starts a Postgres 15 container with a persistent volume. The DB will be available on `localhost:5432` for host processes (your local backend).

3) Notes on connecting your local backend/frontend
- When running the backend on your host (not in Docker), use `localhost:5432` as the DB host.
- If you later run the backend in Docker, set DB_HOST to `db` (the service name) so Docker networking resolves it.

4) Stop the DB
```bash
docker compose -f docker-compose.db.yml down
```

This pattern keeps backend and frontend running on your machine without container isolation while keeping the database in a lightweight Colima VM/container.

7) Running E2E tests locally (Postgres)

If you want to run the Postgres-backed E2E tests locally and ensure the DB and migrations run deterministically, follow these steps from the project root:

```bash
# create the DB (idempotent)
./scripts/create-test-db.sh footdash localhost 5432 postgres postgres

# run migrations so the schema exists
cd backend
npm ci
npm run migrate:run

# run e2e tests serially (recommended locally)
npm run test:e2e -- --runInBand
```

Alternatively you can use the convenience script from the backend package.json which wraps these steps (it expects `DB_*` env vars to be set):

```bash
# from project root
cd backend
# set environment overrides if needed, e.g. DB_NAME, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD
DB_NAME=footdash DB_HOST=localhost DB_PORT=5432 DB_USERNAME=postgres DB_PASSWORD=postgres npm run test:e2e:setup
# then run tests serially
npm run test:e2e:ci
```

Notes:
- Use `--runInBand` to avoid parallel workers clobbering a shared DB schema.
- CI uses a separate DB instance per job; check `.github/workflows/backend-ci.yml` for the exact job configuration.

7a) `create-test-db.sh` advanced usage

The repository includes a small helper script `./scripts/create-test-db.sh` used by CI and local workflows. It now supports two extra flags which are useful for CI and safe testing:

- `--dry-run`: prints the actions the script would take (create DBs, create users) without executing them. Use this to validate CI steps before making changes.
- `--create-user`: attempts to create the DB role/user (named by `--user`) if it does not exist and grants privileges on the created DB(s). Use this in CI only if the runner has permission to create roles.

Examples:

```bash
# dry-run: show what would be done without side effects
./scripts/create-test-db.sh --db footdash --host localhost --port 5432 --user postgres --pass postgres --workers 4 --dry-run

# create base DB + 4 worker DBs and also create/grant the DB user (CI scenarios)
./scripts/create-test-db.sh --db footdash --host localhost --port 5432 --user postgres --pass $PGPASS --workers 4 --create-user
```

CI note:
In CI we call the same script from the workflow. For example the parallel e2e job will run:

```bash
./scripts/create-test-db.sh --db "${{ env.DB_NAME }}" --host localhost --port 5433 --user postgres --pass postgres --workers ${WORKERS}
```

If you want to validate the CI invocation without creating DBs, run the same command locally with `--dry-run`.