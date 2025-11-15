Migrations — dry-run & usage

This repository contains TypeORM migrations in `backend/migrations` and a small migration runner at `backend/scripts/run-migrations.ts`.

Dry-run (list pending migrations)

To safely list pending migrations without applying anything, run from the repository root (examples assume the default docker-compose Postgres):

```bash
# point DATABASE_URL at the DB you want to inspect
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/footdash \
  npm --prefix backend run migrate:show
```

What it does

- `migrate:show` is read-only and compares migration filenames in `backend/migrations` with the rows recorded in the `migrations` table in the target database.
- It prints configured migration files, how many are already applied, and any pending migration filenames (in order).

Apply migrations (when ready)

If you want to actually apply pending migrations (make sure you've backed up production and tested in staging):

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/footdash \
  npm --prefix backend run migrate:run
```

Safety notes

- Always snapshot or backup production DB before applying migrations.
- Prefer running migrations first in staging and run smoke tests.
- `migrate:show` is safe to run in CI or locally and will not modify the database.
