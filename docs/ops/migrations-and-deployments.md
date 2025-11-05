# Migrations & Deployment runbook (Phase 1)

This runbook explains safe migration previews and apply steps, and a minimal deployment checklist for Phase 1.

## Migration preview (dry-run)
Use the project-provided scripts to preview migrations without applying them.

Local preview (disposable DB):

```bash
# Start a disposable Postgres container (example host port 32768)
docker run --name footdash-migrate -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=footdash -p 32768:5432 -d postgres:15

# Run preview (uses scripts/run-migrations)
cd backend-nest
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:32768/footdash npm run migrate:show
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:32768/footdash npm run migrate:show:full

# When done, remove container
docker rm -f footdash-migrate
```

CI preview
- A GitHub Actions job named `migration-dry-run` exists which runs `migrate:show` and `migrate:show:full` against a service Postgres and uploads logs.

## Applying migrations (staging / production)
1. Ensure you have a recent DB backup (snapshot) before applying migrations.
2. Run `migrate:show` against a staging DB that mirrors production to confirm no surprises.
3. Schedule a maintenance window if migrations are destructive or long-running.
4. Apply migrations:

```bash
cd backend-nest
DATABASE_URL=postgresql://postgres:postgres@prod-host:5432/footdash npm run migrate:run
```

5. Run smoke tests and health checks.

## Rollback strategy
- Prefer no-rollback DB migrations. Instead:
  - Use backward-compatible migrations where possible (e.g., add columns, then backfill, then remove old columns later).
  - If a destructive migration must be rolled back, restore DB from backup snapshot.

## Creating a migration (TypeORM example)

```bash
# Add migration file with TypeORM CLI (if configured)
npx typeorm migration:generate -n CreateSomething
```

Or create a manual migration in `backend-nest/migrations` following existing file patterns.

## Deployment checklist (minimal)
1. Merge PR for code changes via protected branch rule and confirm all status checks pass.
2. Ensure migration dry-run artifact shows no pending migrations (or approved plan).
3. Create DB backup / snapshot.
4. Deploy backend to staging and run `migrate:run` if required.
5. Run smoke and e2e tests against staging.
6. Promote to production and apply migrations if staging passes.

## Post-deploy verification
- Health endpoint returns 200
- Critical logs show no errors
- Key endpoints (auth, teams, matches) return expected responses

## Notes & links
- Migration scripts: `backend-nest/scripts/run-migrations.ts`
- Migrations directory: `backend-nest/migrations`
- CI job: `.github/workflows/backend-ci.yml` -> job `migration-dry-run`
