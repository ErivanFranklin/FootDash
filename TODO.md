# FootDash TODO

## Phase 1 - Foundation ✅ COMPLETE
- [x] Move architecture planning docs from `prompt/` into `docs/architecture/` or cross-link them as needed.
- [x] Add backend `.env.example` capturing current Express environment variables.
- [x] Add frontend `.env.example` or equivalent configuration instructions.
- [x] Add backend smoke test (Jest) covering current Express entrypoint.
- [x] Wire Angular `ng test` command into CI guidance or scripts.
- [x] Enable branch protection rules for `main` once ready.
- [x] Open GitHub issues for each Phase A task to track ownership.
- [x] Scaffold NestJS backend: `backend/` (completed)
- [x] Configure database & ORM: TypeORM + Postgres
	- [x] TypeORM DataSource configured in `backend/data-source.ts` (supports `DATABASE_URL` or `DB_*` vars)
	- [x] Add `backend/.env.example` with DB env vars
	- [x] Migration scripts available: `migrate:run`, `migrate:show`, `migrate:show:full`
	- [x] Docs added: `backend/MIGRATIONS.md`
	- [x] CI dry-run on PRs: `.github/workflows/migrate-show-on-pr.yml`
- [x] Push Notifications with FCM
	- [x] Firebase Admin SDK integration
	- [x] Device token registration in database
	- [x] Match notification triggers (start, goal, result)
	- [x] Smoke tests with Slack webhook monitoring
	- [x] Documentation and deployment guide

## Phase 2 - Enhanced Features (33.33% Complete - 2 of 6)

### ✅ Priority 1: Real-time Match Updates (COMPLETE)
- [x] Backend: LiveMatchService for polling Football API
- [x] Backend: MatchSchedulerService with cron-based scheduling
- [x] Backend: WebSocket broadcasting via MatchGateway
- [x] Frontend: LiveMatchService for state management
- [x] Frontend: LiveIndicatorComponent with pulsing animation
- [x] Frontend: Enhanced MatchCardComponent with scores
- [x] Frontend: Real-time MatchDetailsPage with animations
- [x] Score change detection and animations
- [x] Match minute display
- [x] Status-based visual indicators
- [x] Unit tests for LiveMatchService
- [x] Comprehensive documentation

### ✅ Priority 2: Push Notifications (COMPLETE)
- [x] FCM integration
- [x] Device token management
- [x] Match event notifications
- [x] Monitoring and logging

### ⏳ Priority 3: User Preferences
- [ ] Backend: User settings API endpoints
- [ ] Backend: Preferences database schema
- [ ] Frontend: Settings page UI
- [ ] Frontend: Notification preferences
- [ ] Frontend: Theme selection (dark/light mode)
- [ ] Frontend: Language preferences

### ⏳ Priority 4: Match Favorites
- [ ] Backend: Favorites API endpoints
- [ ] Backend: User-match relationships
- [ ] Frontend: Favorite button component
- [ ] Frontend: Favorites list page
- [ ] Frontend: Filter by favorites
- [ ] Push notifications for favorite matches

### ⏳ Priority 5: Team Statistics
- [ ] Backend: Team stats aggregation
- [ ] Backend: Historical data analysis
- [ ] Frontend: Team profile page
- [ ] Frontend: Statistics charts/graphs
- [ ] Frontend: Performance trends
- [ ] Caching strategy for stats

### ⏳ Priority 6: Advanced Filtering
- [ ] Backend: Advanced query endpoints
- [ ] Backend: Date range filtering
- [ ] Backend: Competition/league filtering
- [ ] Frontend: Filter UI component
- [ ] Frontend: Saved filter presets
- [ ] Frontend: Search functionality
