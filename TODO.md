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

## Phase 2 - Enhanced Features (50% Complete - 3 of 6)

### ✅ Priority 1: Real-time Match Updates (COMPLETE) ✅
**Status:** Complete  
**Duration:** Weeks 1-3  
**Completion Date:** December 9, 2025

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
- [x] PR #51 merged successfully

### ✅ Priority 2: Push Notifications (COMPLETE) ✅
**Status:** Complete  
**Duration:** ~2 weeks  

- [x] FCM integration
- [x] Device token management
- [x] Match event notifications
- [x] Monitoring and logging

### ✅ Priority 3: Enhanced User Profiles (COMPLETE) ✅
**Status:** Complete  
**Duration:** Weeks 5-7  
**Completion Date:** December 10, 2025

- [x] Backend: User settings API endpoints
- [x] Backend: Preferences database schema
- [x] Frontend: Settings page UI
- [x] Frontend: Notification preferences
- [x] Frontend: Theme selection (dark/light mode)
- [x] Frontend: Language preferences
- [x] Frontend: User avatar upload
- [x] Frontend: Profile customization

### ⏳ Priority 4: Advanced Analytics & AI
**Status:** Pending  
**Estimated Duration:** Weeks 7-10

- [ ] Backend: Match prediction algorithms
- [ ] Backend: Team performance analytics
- [ ] Backend: Player statistics aggregation
- [ ] Frontend: Analytics dashboard
- [ ] Frontend: Prediction displays
- [ ] Frontend: Interactive charts/graphs
- [ ] ML model integration
- [ ] Historical data analysis

### ⏳ Priority 5: Social Features
**Status:** Pending  
**Estimated Duration:** Weeks 10-12

- [ ] Backend: User-to-user interactions
- [ ] Backend: Comments/reactions system
- [ ] Backend: Social feed
- [ ] Frontend: Social feed UI
- [ ] Frontend: User profiles
- [ ] Frontend: Follow/friend system
- [ ] Real-time social notifications
- [ ] Content moderation

### ⏳ Priority 6: Admin Dashboard
**Status:** Pending  
**Estimated Duration:** Weeks 12-14

- [ ] Backend: Admin API endpoints
- [ ] Backend: User management
- [ ] Backend: Content moderation tools
- [ ] Backend: Analytics API
- [ ] Frontend: Admin dashboard UI
- [ ] Frontend: User management interface
- [ ] Frontend: System monitoring
- [ ] Frontend: Notification management
- [ ] Role-based access control
