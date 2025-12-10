# Migrations — Usage & Status

This repository contains TypeORM migrations in `backend/migrations` and a migration runner at `backend/scripts/run-migrations.ts`.

## Current Migration Status

**Last Updated**: December 9, 2025

**Applied Migrations**:
1. ✅ `CreateUsersTable1680000000000` - Creates `users` table with `id`, `email`, `password_hash`, `created_at`
2. ✅ `AddMatchMetadata1690001000000` - Adds `referee`, `venue`, `league` columns to `matches` table
3. ✅ `AddUserProfileAndPreferences1733783250000` - Creates `user_profiles` and `user_preferences` tables with enums for theme/language

**Database**: `footdash` (PostgreSQL)
**Status**: All migrations applied successfully

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
- Entity property `email` and `passwordHash` are temporarily nullable in the entity to support test-time schema synchronization

### Application vs. Test Database Sync

- **Application (`DatabaseModule`)**: Uses `synchronize: false` to rely on migrations only
- **E2E Tests**: Use `synchronize: true` for convenience in isolated test environments
- This split allows production-safe migrations while keeping tests flexible

## Helper Scripts

Located in `backend/scripts/`:

- `run-migrations.ts` - Migration runner with dry-run support
- `seed-dev.ts` - Seeds development user data
- `fix-passwordhash.ts` - Utility to backfill NULL password/email values (for migration troubleshooting)
- `check-null-users.ts` - Diagnostic script to find users with NULL emails
- `check-null-passwords.ts` - Diagnostic script to find users with NULL passwords

## Safety Notes

- ⚠️ **Always backup production databases** before applying migrations
- ✅ Run migrations in staging first and execute smoke tests
- ✅ `migrate:show` is safe to run in CI/CD or production (read-only)
- ✅ The migration runner uses `AppDataSource` with `migrationsRun: false` to prevent auto-execution
- ⚠️ For production deployments, consider running migrations separately from app deployment to avoid startup delays
