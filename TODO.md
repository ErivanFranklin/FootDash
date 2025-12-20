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

## Phase 2 - Enhanced Features (100% Complete - 5 of 5) ✅

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

### ✅ Priority 4: Advanced Analytics & AI (COMPLETE) ✅
**Status:** Complete  
**Duration:** Weeks 7-10  
**Completion Date:** December 10, 2025

- [x] Backend: Match prediction algorithms (statistical model)
- [x] Backend: Team performance analytics (form, win rate, H2H)
- [x] Backend: 5 core services (FormCalculator, StatisticalAnalysis, InsightsGenerator, MatchPrediction, TeamAnalytics)
- [x] Backend: 7 REST API endpoints with JWT authentication
- [x] Backend: Database migrations (match_predictions, team_analytics tables)
- [x] Frontend: Analytics service with HTTP client and caching
- [x] Frontend: PredictionCardComponent with Chart.js doughnut chart
- [x] Frontend: TeamAnalyticsCardComponent with line/bar charts
- [x] Frontend: TeamComparisonComponent for side-by-side analysis
- [x] Frontend: MatchPredictionPage (/analytics/match/:matchId)
- [x] Frontend: TeamAnalyticsPage (/analytics/team/:teamId)
- [x] Routing and navigation integration
- [x] Unit tests for core services
- [x] Comprehensive documentation
- [x] Enhancements roadmap (ML models, weather data, player availability)

### ✅ Priority 5: Social Features (COMPLETE) ✅
**Status:** Complete  
**Duration:** Weeks 10-12  
**Completion Date:** December 19, 2025

- [x] Backend: User-to-user interactions (Follow, Report)
- [x] Backend: Comments/reactions system
- [x] Backend: Social feed (Global & Personalized)
- [x] Frontend: Social feed UI
- [x] Frontend: User profiles with reporting
- [x] Frontend: Follow/friend system
- [x] Real-time social notifications (WebSockets)
- [x] Content moderation (Reporting system)

#### 📋 Priority 5: Social Features (Refinement) - Outstanding Items
**Status:** Pending  
**Estimated Duration:** 1-2 weeks

**Content Moderation:**
- [ ] Reporting System: Backend/Frontend for users to report inappropriate comments or profiles
- [ ] Profanity Filtering: Basic automated check for comment content

**Social Feed Refinement:**
- [ ] Following vs. Global: Frontend toggle/tab to switch between personalized feed (people you follow) and global community feed
- [ ] Activity Templates: Ensure feed correctly displays different types of activity (e.g., "User A predicted Arsenal to win" vs. "User B followed you")

**Real-time Social Notifications:**
- [ ] In-App Alerts: Toast or notification badge when user receives a new follower or reaction while app is open

### ⏳ Priority 6: Admin Dashboard (NEW)
**Status:** Not Started  
**Estimated Duration:** Weeks 12-14

**Backend:**
- [ ] RBAC (Role-Based Access Control): Implement AdminGuard and roles in User entity
- [ ] Admin API: Endpoints for user management (block/delete) and content moderation (reviewing reports)
- [ ] System Monitoring: API to check server health, DB stats, and active WebSocket connections

**Frontend:**
- [ ] Admin UI: Dedicated area for administrators to manage the platform
- [ ] User Management: Interface to search, view, and manage user accounts
- [ ] Moderation Queue: Interface to review reported content and take action
