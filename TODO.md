# FootDash TODO

- [x] Move architecture planning docs from `prompt/` into `docs/architecture/` or cross-link them as needed.
- [x] Add backend `.env.example` capturing current Express environment variables.
- [x] Add frontend `.env.example` or equivalent configuration instructions.
- [x] Add backend smoke test (Jest) covering current Express entrypoint.
- [x] Wire Angular `ng test` command into CI guidance or scripts.
- [x] Enable branch protection rules for `main` once ready.
- [x] Open GitHub issues for each Phase A task to track ownership.

- [x] Scaffold NestJS backend: `backend/` (completed)
- [ ] Configure database & ORM: TypeORM + Postgres
	- [x] TypeORM DataSource configured in `backend/data-source.ts` (supports `DATABASE_URL` or `DB_*` vars)
	- [ ] Add `backend/.env.example` with DB env vars
	- [x] Migration scripts available: `migrate:run`, `migrate:show`, `migrate:show:full`
	- [x] Docs added: `backend/MIGRATIONS.md`
	- [x] CI dry-run on PRs: `.github/workflows/migrate-show-on-pr.yml`
