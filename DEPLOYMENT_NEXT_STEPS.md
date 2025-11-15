Migration deployment — next steps

This branch contains a short, actionable checklist and commands to run the migration workflow safely through staging and production.

Checklist

1. Create PR & review
   - Open a PR comparing `chore/migration-next-steps` -> `main` and request review from one reviewer.

2. Dry-run in staging (read-only)
   - Point at the staging DB (ensure it is a recent copy of production):

```bash
DATABASE_URL=postgresql://<user>:<pass>@staging-host:5432/footdash \
  npm --prefix backend run migrate:show:full
```

3. Apply migrations in staging (after backup)

```bash
# backup staging (example using pg_dump)
pg_dump -h staging-host -U postgres -Fc -d footdash -f /tmp/footdash-staging-pre-migration.dump

# apply migrations
DATABASE_URL=postgresql://<user>:<pass>@staging-host:5432/footdash \
  npm --prefix backend run migrate:run
```

4. Smoke tests on staging
   - Run API health checks, basic UI flows (login, Teams, Matches pages), and any critical path integration tests.

5. Prepare production
   - Schedule maintenance or inform stakeholders if needed.
   - Take a full backup or snapshot of production DB.

6. Production dry-run (optional)
   - If you have a read-only copy of production or a staging snapshot, run `migrate:show:full` against it.

7. Apply migrations in production (after backup)

```bash
# backup production
pg_dump -h prod-host -U postgres -Fc -d footdash -f /tmp/footdash-prod-pre-migration.dump

# apply migrations
DATABASE_URL=postgresql://postgres:<prod-password>@prod-host:5432/footdash \
  npm --prefix backend run migrate:run
```

8. Post-deploy verification
   - Verify app logs for errors, run smoke-tests, and monitor traffic/metrics for a short period.

9. Rollback plan
   - If issues are detected, restore DB from the pre-migration backup/snapshot.
   - Do not use `down()` for destructive rollbacks on production unless you know the exact implications; prefer restore.

Notes
- The repo includes `migrate:show` (short) and `migrate:show:full` (detailed) scripts. `migrate:show:full` prints migration source snippets for pending files — safe/read-only.
- A CI workflow (`.github/workflows/migrate-show-on-pr.yml`) was added to run `migrate:show:full` on PRs.

Commands to run locally (examples)

```bash
# short dry-run
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/footdash \
  npm --prefix backend run migrate:show

# full dry-run
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/footdash \
  npm --prefix backend run migrate:show:full

# apply migrations
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/footdash \
  npm --prefix backend run migrate:run
```

If you want, I can open the PR for this branch, or convert the checklist into a GitHub issue or project card. Let me know which you prefer.