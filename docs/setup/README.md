# Developer setup & local environment

This document explains how to get a local development environment running for the Phase 1 FootDash scaffold.

## Goals
- Fast local setup for frontend and backend
- Reproducible database for migrations and testing
- Clear environment variables and seeding instructions

## Prerequisites
- Node.js 20+
- npm
- Docker & Docker Compose (for DB and optional services)
- Git

## Environment variables
Create a `.env` file in `backend-nest/` with at least these entries (example values):

```
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/footdash
PORT=3000
JWT_SECRET=dev-secret
FOOTBALL_API_KEY=your-api-key-here
FOOTBALL_API_URL=https://api.example.com
```

Frontend environment variables live in `frontend/environments/` — typical values:

```
API_BASE_URL=http://localhost:3000
```

## Local Postgres (recommended)
Use Docker Compose or a disposable container. Example (one-off container for testing):

```bash
docker run --name footdash-dev -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=footdash -p 5432:5432 -d postgres:15
# wait until ready
docker exec footdash-dev pg_isready -U postgres
```

To remove:

```bash
docker rm -f footdash-dev
```

## Install & run backend (dev)

```bash
cd backend-nest
npm ci
# copy .env or set DATABASE_URL env var
npm run start:dev   # or `npm run start` depending on script
```

## Install & run frontend (dev)

```bash
cd frontend
npm ci
npm run start
# or use ionic serve if using Ionic CLI
```

## Database seeding (dev)
- A simple seeder script exists at `backend-nest/scripts/seed-dev.ts` (if present). Run with ts-node or via `npm` scripts:

```bash
cd backend-nest
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/footdash npm run seed:dev
```

If the project has no seeder, run SQL fixtures in `backend-nest/migrations` or create a minimal seed that inserts a test user and sample teams.

## Running migrations locally (preview then apply)
- Preview:

```bash
cd backend-nest
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/footdash npm run migrate:show
```

- Apply:

```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/footdash npm run migrate:run
```

## Tests
- Backend unit tests: `cd backend-nest && npm test`
- Frontend tests: `cd frontend && npm test`

## Troubleshooting
- If Postgres ports are in use, map to a different host port and update `DATABASE_URL` accordingly.
- If `npm ci` fails on CI or locally, inspect `backend-nest/test-results/npm-ci*.log` (CI) or run `npm install` locally as fallback.

---
This document is a minimal onboarding guide. For production deployment and secrets management see `docs/ops/migrations-and-deployments.md`.
