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

#### 📋 Priority 5.5: Social Features Refinement - Outstanding Items
**Status:** ✅ COMPLETE  
**Estimated Duration:** 1-2 weeks  
**Completion Date:** December 20, 2025

**Content Moderation:**
- [x] Profanity Filtering Service: Backend service with regex-based word detection, case-insensitive matching, word boundary detection
- [x] Configurable banned words list with add/remove methods
- [x] Comprehensive unit tests (13 test suites)

**Social Feed Refinement:**
- [x] Following vs. Global Toggle: FeedType enum (FOLLOWING/GLOBAL) with default to FOLLOWING
- [x] FeedQueryDto updated with feedType parameter
- [x] FeedController routes to appropriate service method based on feedType
- [x] Both getGlobalFeed() and getUserFeed() available via single endpoint

**Real-time Social Notifications:**
- [x] Alert Entity: AlertType enum (FOLLOWER, REACTION, COMMENT, MENTION, SYSTEM)
- [x] Alerts Service: 9 methods for full alert lifecycle (create, get, mark as read, delete, bulk operations)
- [x] Alerts Controller: 6 endpoints with JWT authentication
- [x] Database migrations with proper indexes and foreign keys
- [x] Comprehensive service tests (11 test suites)
- [x] Comprehensive controller tests (8 test suites)

### ✅ Priority 6: Admin Dashboard (COMPLETE) ✅
**Status:** Complete  
**Duration:** Weeks 12-14  
**Completion Date:** December 19, 2025

**Backend:**
- [x] RBAC with UserRole enum (USER/ADMIN) in User entity
- [x] AdminGuard for endpoint protection
- [x] Admin API: 12 endpoints for user and content management
- [x] Admin Service: 11 methods (user management, blocking, content moderation, system health monitoring)
- [x] Database migrations for RBAC

**Frontend:**
- [x] Admin Dashboard Page: Overview with quick stats
- [x] User Management Page: Search, view, and manage users
- [x] Moderation Queue Page: Review reports and take actions
- [x] System Monitoring Page: Display system health metrics
- [x] Admin routing: /admin, /admin/users, /admin/reports, /admin/system
- [x] Admin Guard for route protection
- [x] Full CRUD UI for administrative tasks

**Testing:**
- [x] Backend unit tests: AdminService (30+ scenarios), AdminController (20+ scenarios)
- [x] Frontend component tests: 4 pages × 10+ scenarios each
- [x] E2E tests: 20+ integration scenarios covering authorization, management workflows

## Phase 3 - CI/CD & Deployment (NEW) ⏳

### ✅ Priority 7: Enhanced CI/CD Pipeline (COMPLETE) ✅
**Status:** Complete  
**Duration:** 1 week  
**Completion Date:** December 20, 2025

**Enhanced CI Workflow (`enhanced-ci.yml`):**
- [x] Automatic change detection (backend/frontend/infra-specific)
- [x] Parallel test execution (backend + frontend simultaneously)
- [x] Backend unit tests with Jest coverage (4 workers)
- [x] Backend E2E tests with PostgreSQL service
- [x] Frontend linting with ESLint
- [x] Frontend unit tests with Karma + Chromium headless
- [x] Frontend production build
- [x] Docker image builds for backend and frontend
- [x] Layer caching for faster builds
- [x] Security scanning with Trivy and npm audit
- [x] Code coverage reporting with Codecov integration
- [x] Test result publishing and PR comments
- [x] Coverage summaries in PR comments and CI job summary
- [x] Final CI status aggregation

**Production Deployment Workflow (`deploy-production.yml`):**
- [x] Multi-environment support (staging + production)
- [x] Docker image building and registry push
- [x] AWS credentials configuration
- [x] Pre-deployment database backups
- [x] Blue-green deployment support
- [x] Health checks and smoke tests
- [x] Slack notifications for deployment status
- [x] Automatic rollback on deployment failure
- [x] Deployment record creation in GitHub
- [x] Manual approval gates for production

**Maintenance Workflow (`maintenance.yml`):**
- [x] Weekly scheduled dependency updates
- [x] Automated PR creation for npm updates
- [x] Security audit scanning with npm audit
- [x] Code quality and linting checks
- [x] Database migration testing (up and down)
- [x] Performance analysis (bundle size tracking)
- [x] Artifact cleanup (>30 days old)

**Documentation:**
- [x] Comprehensive CI/CD Pipeline Guide (`docs/ci-cd-pipeline.md`)
- [x] Architecture diagrams and workflow descriptions
- [x] Configuration and secrets setup instructions
- [x] Troubleshooting guide
- [x] Performance optimization tips
- [x] Future enhancements roadmap

### 🔼 Coverage Gates Roadmap
- [x] Establish initial coverage thresholds (backend/frontend): statements 60%, branches 50%, functions 60%, lines 60%
- [x] Add CI PR comment coverage summary (backend + frontend)
- [ ] Raise thresholds to statements 70%, branches 60%, functions 70%, lines 70% after 3 consecutive green CI runs
- [ ] Track coverage trend via Codecov dashboards; document baseline in `docs/ci-cd-pipeline.md`

### ✅ CI Utility Workflows (COMPLETE)
- [x] k6 Smoke Test Workflow (`.github/workflows/loadtest-k6.yml`) — manual dispatch with `base_url`
- [x] Backup Verification Workflow (`.github/workflows/backup-verify.yml`) — manual dispatch, uploads `backup-verification` artifact

## Phase 5 - Global Intelligence & Analytics (100% Complete) ✅
**Status:** Complete
**Completion Date:** January 24, 2026

- [x] **Internationalization (i18n)**
  - [x] Configure `@jsverse/transloco`
  - [x] Implement Language Switcher
  - [x] Translate Core Components (Nav, Matches, Settings)
  - [x] Translate Assets (EN, PT, ES)
- [x] **Backend Analytics Engine**
  - [x] `MatchPredictionService` (Win Probability Logic)
  - [x] `FormCalculatorService` (Form Ratings 0-100)
  - [x] `StatisticalAnalysisService` (H2H, Performance Stats)
  - [x] Analytics API Endpoints
- [x] **Frontend Visualization**
  - [x] `PredictionCardComponent` (Confidence, Probabilities)
  - [x] `TeamComparisonComponent` (Radar Chart)
  - [x] `TeamAnalyticsCardComponent` (Trend & Performance Charts)
  - [x] Localization of Charts & Insights
