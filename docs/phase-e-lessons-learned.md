# Phase E — Lessons Learned

This document captures practical lessons and recommendations uncovered during Phase E (Cleanup & Enhancements).

## Key Lessons

- Async persistence matters: always await database writes when subsequent logic depends on the saved entity. The race condition in `AuthService.createTokens()` caused subtle e2e failures in Postgres but not in SQLite unit tests.

- Migrations over sync: rely on TypeORM migrations for schema changes in CI/production. Turn off `synchronize` in runtime configs to avoid accidental schema changes.

- Column naming consistency: prefer database naming conventions (snake_case). Use `@Column({ name: 'snake_case' })` in entities to map to existing schemas when migrating from legacy DBs.

- E2E parity: ensure e2e tests run against the same environment as the app (global pipes, validation). Missing `ValidationPipe` caused request payload transformation differences.

- Proxy & dev server mismatches: Angular dev server proxy (`proxy.conf.json`) must point to actual backend port. Keep README examples updated.

- CI etiquette: prefer LTS Node versions in workflows and create an `.nvmrc` to standardize local development.

- Upstream warnings: not all warnings are actionable. Document upstream tool warnings (Stencil empty-glob) and why they're safe.

## Recommendations

1. Add a pre-merge checklist for migrations: ensure migration files are committed, run `migrate:show`, and avoid runtime `synchronize`.
2. Add a PR template that reminds authors to update README and `MIGRATIONS.md` when adding migrations.
3. Add a small integration test that runs `npm run migrate:show` in CI to ensure migrations are available and runnable.
4. Add a short section to `backend/README.md` on how to debug migration issues and how to backfill missing fields safely.

## Next Steps

- Finish shared components library expansion and create a small design token page.
- Add the pre-merge migration checklist to `.github/PULL_REQUEST_TEMPLATE.md`.
- Revisit CI build warnings once major deps (Stencil/Angular) update.
