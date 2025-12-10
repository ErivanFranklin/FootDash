# Migrations — Usage & Status

This repository contains TypeORM migrations in `backend/migrations` and a migration runner at `backend/scripts/run-migrations.ts`.

## Current Migration Status

**Last Updated**: December 10, 2025

**Applied Migrations**:
1. ✅ `CreateUsersTable1680000000000` - Creates `users` table with `id`, `email`, `password_hash`, `created_at`
2. ✅ `AddMatchMetadata1690001000000` - Adds `referee`, `venue`, `league` columns to `matches` table
3. ✅ `CreateNotificationsAndTeams1700000000000` - Creates `notifications` and `teams` tables and related indexes
4. ✅ `AddUserProfileAndPreferences1733783250000` - Creates `user_profiles` and `user_preferences` tables with enums for theme/language
5. ✅ `CreateRefreshTokens1740000000000` - Creates `refresh_tokens` table to persist refresh tokens for users (token, revoked, created_at)

**Database**: `footdash` (PostgreSQL)
**Status**: All migrations applied successfully (no pending migrations)

## Available Commands


### Check Migration Status

To safely list pending migrations without applying anything:

```bash
# Show brief status
npm --prefix backend run migrate:show

# Show full details
npm --prefix backend run migrate:show:full

# With custom database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/footdash \
  npm --prefix backend run migrate:show
```

**What it does**: Read-only comparison of migration files in `backend/migrations` with the `migrations` table in the target database.


### Apply Migrations

To apply pending migrations:

```bash
npm --prefix backend run migrate:run

# With custom database credentials
DB_PASSWORD=postgres npm --prefix backend run migrate:run
```

### Seed Development Data

After migrations, seed the database with development data:

```bash
npm --prefix backend run seed:dev
```

## Database Setup from Scratch

To set up a fresh database:

```bash
# 1. Create database
PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE footdash;"

# 2. Apply migrations
DB_PASSWORD=postgres npm --prefix backend run migrate:run

# 3. Seed dev data (optional)
DB_PASSWORD=postgres npm --prefix backend run seed:dev

# 4. Verify
npm --prefix backend run migrate:show:full
```

## Important Configuration Notes

### Entity-Database Column Mapping

The `User` entity uses snake_case column names in the database to match the migrations:
- Entity property `passwordHash` maps to DB column `password_hash`

### Application vs. Test Database Sync

- **Application (`DatabaseModule`)**: Uses `synchronize: false` and relies on migrations only (production-safe)
- **E2E Tests**: Use `migrationsRun: true` in test bootstraps so test databases are created/updated via the same migrations as application environments. This prevents schema drift and avoids destructive `synchronize` behavior during parallel CI runs.

This approach keeps production and CI schemas consistent while allowing per-worker databases for parallel tests.

## Helper Scripts

Located in `backend/scripts/`:

- `run-migrations.ts` - Migration runner with dry-run support
- `seed-dev.ts` - Seeds development user data
- `fix-passwordhash.ts` - Utility to backfill NULL password/email values (for migration troubleshooting)
- `check-null-users.ts` - Diagnostic script to find users with NULL emails
- `check-null-passwords.ts` - Diagnostic script to find users with NULL passwords
 - `run-migrations.ts` - Migration runner with dry-run support
 - `seed-dev.ts` - Seeds development user data
 - `fix-passwordhash.ts` - Utility to backfill NULL password/email values (for migration troubleshooting)
 - `check-null-users.ts` - Diagnostic script to find users with NULL emails
 - `check-null-passwords.ts` - Diagnostic script to find users with NULL passwords
 - `../scripts/create-test-db.sh` - Repo-level helper to create base and per-worker test DBs (used by CI and local flows)

## Migration files (machine-readable)

Below is a concise table of migration files present in `backend/migrations` with their numeric timestamps and a short description. All listed migrations are applied in the current `footdash` database.

| Timestamp | Filename | Description | Status |
|---:|---|---|---|
| 1680000000000 | `1680000000000-CreateUsersTable.ts` | Create `users` table (`id`, `email`, `password_hash`, `created_at`) | ✅ applied |
| 1690001000000 | `1690001000000-AddMatchMetadata.ts` | Add `referee`, `venue`, `league` to `matches` | ✅ applied |
| 1700000000000 | `1700000000000-CreateNotificationsAndTeams.ts` | Create `notifications` and `teams` tables | ✅ applied |
| 1733783250000 | `1733783250000-AddUserProfileAndPreferences.ts` | Create `user_profiles` and `user_preferences` (enums for theme/language) | ✅ applied |
| 1740000000000 | `1740000000000-CreateRefreshTokens.ts` | Create `refresh_tokens` table for persisted refresh tokens | ✅ applied |


## Safety Notes

- ⚠️ **Always backup production databases** before applying migrations
- ✅ Run migrations in staging first and execute smoke tests
- ✅ `migrate:show` is safe to run in CI/CD or production (read-only)
- ✅ The migration runner uses `AppDataSource` with `migrationsRun: false` to prevent auto-execution
- ⚠️ For production deployments, consider running migrations separately from app deployment to avoid startup delays
