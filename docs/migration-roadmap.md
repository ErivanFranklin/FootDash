# FootDash Phase 1 Migration Roadmap

This roadmap bridges the current lightweight Express + Ionic codebase to the long-term scaffolding defined in `prompt/007-phase-1-scaffold-plan.md`. It is designed so you can evolve toward the NestJS + modular Angular target without blocking ongoing feature work. All work items assume the servers can be restarted during refactors.

---

## 1. Current Snapshot

| Area      | Original State (Archived) | Current State |
|-----------|---------------------------|---------------|
| Backend   | Single-file Express app (`archive/backend-legacy/index.js`), in-memory auth, flat folder | NestJS modules (`backend/`) with auth, users, teams, matches, football-api, shared `common/`, TypeORM configs, structured tests |
| Frontend  | Ionic standalone pages (`home`, `login`) and services under `app/services` | Same structure, ready for Phase C modularisation into layered folders (`core`, `features`, `shared`) |
| DevOps    | Colima-powered Postgres, local scripts | Full Docker stack, comprehensive docs in `docs/`, CI/CD workflows |
| Docs      | Concept docs under `prompt/` | Dedicated `docs/` folder for architecture, operations, and API documentation |

---

## 2. Guiding Principles

1. **Incremental Module Parity** – Build new NestJS/Angular modules alongside existing features, migrate routes/components in slices.
2. **Shared Contracts First** – Stabilise DTOs, interfaces, and environment variables before deep rewrites.
3. **Automate Regression Safety** – Add tests and linting gates at each step to keep refactors safe.
4. **Keep Dev Velocity** – Maintain runnable Express + Ionic app until NestJS + modular Angular reach parity.

---

## 3. Migration Phases

### Phase A – Preparation ✅ COMPLETE

**Status**: Completed

- ✅ **Version control clean-up** – Branch protections and workflow established
- ✅ **Documentation foundation** – Moved architecture docs to `docs/`
- ✅ **Environment specifications** – Created `.env.example` files
- ✅ **Testing baseline** – Added Jest tests and CI for both backend and frontend

### Phase B – Backend Parallel NestJS Build ✅ COMPLETE

**Status**: Completed January 2025. NestJS backend achieved full parity with legacy Express backend.

**Completed Items**:
1. ✅ **Scaffolded NestJS app** under `backend/`
   - Configured TypeORM with PostgreSQL support
   - Created module structure (`common`, `config`, `auth`, `users`, `teams`, `matches`, `football-api`)
2. ✅ **Shared config + DTOs**
   - Ported auth DTOs (register, login, refresh tokens, profile)
   - Created shared interfaces for team/match data
3. ✅ **Auth Migration**
   - Implemented JWT auth with `JwtStrategy`, `JwtAuthGuard`
   - Added endpoints: register, login, refresh, logout, profile
   - Configured Passport.js integration
4. ✅ **Domain Modules**
   - Implemented Users module with entity and service
   - Implemented Teams module with football-data.org API integration
   - Implemented Matches module with external API integration
   - Added Swagger/OpenAPI documentation
5. ✅ **Switch-over**
   - Updated Docker compose to use NestJS backend
   - Archived legacy Express server to `archive/backend-legacy/`
   - Created tag `v1.0.0-legacy-backend` for reference

**Key Achievements**:
- Full feature parity with Express backend
- Comprehensive e2e test coverage
- Mock mode for development without external API
- Database migrations system in place
- CI/CD pipeline integrated

### Phase C – Frontend Modularisation 🔄 IN PROGRESS (Next Phase)

**Status**: Ready to begin. Backend foundation complete.

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

### Phase D – DevOps Consolidation ✅ COMPLETE

**Status**: Completed

- ✅ Created `docker/` with service-specific configurations
- ✅ Added GitHub Actions workflows for lint + tests
- ✅ Published comprehensive documentation in `docs/`
- ✅ Docker compose working for full stack (backend, frontend, database)

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

| Risk | Mitigation | Status |
|------|------------|--------|
| Large big-bang rewrite | Keep Express running in parallel; port routes module-by-module | ✅ Successfully mitigated - parallel development completed |
| Schema drift between Express and NestJS | Define shared TypeScript interfaces/DTOs in `backend/src/common/dto` and maintain consistency | ✅ Successfully mitigated - shared DTOs maintained |
| Frontend regressions during file moves | Lean on Cypress/Playwright smoke tests and Angular standalone component imports to quickly verify | 🔄 Ongoing for Phase C |
| Deployment surprises | Maintain working Docker compose throughout; add staging environment before go-live | ✅ Docker compose maintained and functional |

---

## 6. Immediate Next Actions

1. Create `docs/` folder (done) and place this roadmap there.
2. Move existing prompt planning docs or link to them from `docs/README.md`.
3. Open GitHub issues for Phase A tasks (env examples, baseline tests).
4. Schedule kick-off sprint to scaffold NestJS base and start frontend folder reorganisation.

---

By following this roadmap, FootDash will reach the robust structure defined in the Phase 1 scaffold while minimising downtime and keeping the team productive.
