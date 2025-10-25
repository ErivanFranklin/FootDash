# FootDash Phase 1 Migration Roadmap

This roadmap bridges the current lightweight Express + Ionic codebase to the long-term scaffolding defined in `prompt/007-phase-1-scaffold-plan.md`. It is designed so you can evolve toward the NestJS + modular Angular target without blocking ongoing feature work. All work items assume the servers can be restarted during refactors.

---

## 1. Current Snapshot

| Area      | Current State | Gaps vs Target Scaffold |
|-----------|---------------|--------------------------|
| Backend   | Single-file Express app (`backend/index.js`), in-memory auth, flat folder | Target expects NestJS modules (auth, users, teams, matches, football-api), shared `common/`, TypeORM configs, structured tests |
| Frontend  | Ionic standalone pages (`home`, `login`) and services under `app/services` | Target requires layered folders (`core`, `features`, `shared`), Auth feature module, theming assets |
| DevOps    | Colima-powered Postgres, local scripts only | Target envisions full Docker stack, docs, CI/CD, shared config files |
| Docs      | Concept docs under `prompt/` | Target expects dedicated `docs/` folder for architecture + ops |

---

## 2. Guiding Principles

1. **Incremental Module Parity** – Build new NestJS/Angular modules alongside existing features, migrate routes/components in slices.
2. **Shared Contracts First** – Stabilise DTOs, interfaces, and environment variables before deep rewrites.
3. **Automate Regression Safety** – Add tests and linting gates at each step to keep refactors safe.
4. **Keep Dev Velocity** – Maintain runnable Express + Ionic app until NestJS + modular Angular reach parity.

---

## 3. Migration Phases

### Phase A – Preparation (1–2 sprints)

- [ ] **Version control clean-up** – Confirm `main` & `feature` branches, enable branch protections.
- [x] **Documentation foundation** – Move `prompt/*.md` that describe architecture into `docs/` (keep prompt history for ideation).
- [x] **Environment specifications** – Create `.env.example` files for backend/frontend with existing vars.
- [ ] **Testing baseline** – Add minimal backend Jest smoke test (can run against Express) and frontend `ng test` CI command.

### Phase B – Backend Parallel NestJS Build (2–4 sprints)

1. **Scaffold NestJS app** under `backend-nest/` (temporary path):
   - `npx @nestjs/cli new backend-nest` (or convert current folder once stable).
   - Configure TypeORM and module folders (`common`, `config`, `auth`, `users`, `teams`, `matches`, `football-api`).
2. **Shared config + DTOs**
   - Port auth DTOs from Express services into NestJS `dto/`.
   - Create shared interfaces for team/match data returned by the future football API.
3. **Auth Migration**
   - Implement JWT auth in NestJS (`auth.service`, `jwt.strategy`, guards).
   - Point Ionic frontend to NestJS auth endpoints behind `/api` path.
4. **Domain Modules**
   - Incrementally port Express routes (users, matches etc.) into NestJS modules.
   - Maintain proxy in Express that forwards to NestJS during migration if needed.
5. **Switch-over**
   - Once parity achieved, update Docker + scripts to start NestJS app instead of Express.
   - Remove legacy Express server or archive under `legacy/`.

### Phase C – Frontend Modularisation (1–3 sprints, overlaps Phase B)

1. **Introduce directory skeleton**
   - `app/core` (singleton services, interceptors, guards)
   - `app/shared` (UI atoms/molecules, directives, pipes)
   - `app/features/auth`, `app/features/dashboard`, etc.
2. **Relocate existing services/pages**
   - Move `AuthService`, interceptor, guard into `core/services` & `core/interceptors`.
   - Wrap `LoginPage` into `features/auth/pages/login` and create routing config per feature.
3. **Feature modules / standalone**
   - Use standalone components but group them logically; create `features/dashboard` module for `home` page.
4. **Theme system**
   - Add `src/theme/_tokens.scss`, expose team-based CSS vars; ensure global styles import theme tokens.
5. **Shared components**
   - Extract duplicated UI (e.g., header, stat cards) into `shared/components` as the dashboard grows.

### Phase D – DevOps Consolidation (1–2 sprints)

- Create `docker/` folder with service-specific Dockerfiles and compose overrides (frontend, backend, db, pgadmin).
- Add GitHub Actions workflow for lint + tests (
  - `frontend`: `npm ci`, `npm run lint`, `npm test -- --watch=false`
  - `backend-nest`: `npm ci`, `npm run lint`, `npm run test`
  ).
- Publish docs: update `docs/migration-roadmap.md` (this file) with progress, add diagrams to `docs/architecture/`.
- Evaluate hosting targets (e.g., Azure Static Web Apps + App Service) and script IaC stubs if needed.

### Phase E – Cleanup & Enhancements

- Remove deprecated Express files.
- Update READMEs (root + per project) to reflect new commands.
- Capture lessons learned for future phases (e.g., notifications, analytics).

---

## 4. Work Breakdown (Initial Backlog)

| Epic | Stories |
|------|---------|
| Backend Bootstrap | Scaffold NestJS app; configure TypeORM + PostgreSQL connection; implement global pipes/helmet/cors; migrate auth; create football API service with axios |
| Frontend Layering | Create `core`, `shared`, `features` directories; move auth logic; configure route-level lazy loading; add theme tokens |
| Tooling & Config | `.env.example` + validation; docs migration; script updates (`scripts/dev-fast.sh` to start NestJS once ready) |
| CI/CD & Docker | GitHub Actions pipeline; docker-compose full stack; ensure local + CI compatibility |

Each story should end with: tests updated, docs tweaked, and migration checklist updated.

---

## 5. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large big-bang rewrite | Keep Express running in parallel; port routes module-by-module |
| Schema drift between Express and NestJS | Define shared TypeScript interfaces/DTOs in `backend/src/common/dto` and import in both services until cutover |
| Frontend regressions during file moves | Lean on Cypress/Playwright smoke tests and Angular standalone component imports to quickly verify |
| Deployment surprises | Maintain working Docker compose throughout; add staging environment before go-live |

---

## 6. Immediate Next Actions

1. Create `docs/` folder (done) and place this roadmap there.
2. Move existing prompt planning docs or link to them from `docs/README.md`.
3. Open GitHub issues for Phase A tasks (env examples, baseline tests).
4. Schedule kick-off sprint to scaffold NestJS base and start frontend folder reorganisation.

---

By following this roadmap, FootDash will reach the robust structure defined in the Phase 1 scaffold while minimising downtime and keeping the team productive.
