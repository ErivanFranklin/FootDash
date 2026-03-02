# FootDash — Feature Roadmap & Implementation Plans

> **Created:** March 1, 2026  
> **Last Updated:** March 2, 2026  
> **Status:** Complete (Phases 8-13)  

This document is the single source of truth for all planned features, improvements, and tech-debt items for FootDash. Each item includes scope, priority, effort estimate, and an implementation plan.

## Completion Overview

| Phase | Status | Items | Commit |
|-------|--------|-------|--------|
| **Phase 8** — Critical Tech Debt | ✅ COMPLETE | 8.1-8.7 | Multiple commits |
| **Phase 9** — Core Missing Features | ✅ COMPLETE | 9.1-9.6 | Multiple commits |
| **Phase 10** — Engagement & Polish | ✅ COMPLETE | 10.1-10.6 | Multiple commits |
| **Phase 11** — Architecture & Quality | ✅ COMPLETE | 11.1-11.7 | `b67e232`, `d64d4a3` |
| **Phase 12** — State Management Migration | ✅ COMPLETE | 12.1-12.5 | `dfdd96b` |
| **Phase 13** — Future Vision | ✅ COMPLETE | 13.1-13.6 | Phase 13 commit |

5. [Phase 11 — Architecture & Quality](#phase-11--architecture--quality)
6. [Phase 12 — State Management Migration](#phase-12--state-management-migration)
7. [Phase 13 — Future Vision](#phase-13--future-vision)
8. [Sprint Calendar](#sprint-calendar)

---

## Priority Legend

| Label | Meaning |
|-------|---------|
| 🔴 P0 | **Blocker** — Must fix before any production deployment |
| 🟠 P1 | **High** — Next sprint, high user/business impact |
| 🟡 P2 | **Medium** — Important but can wait 1-2 sprints |
| 🔵 P3 | **Low** — Nice-to-have, backlog |
| ⚪ P4 | **Future Vision** — Research / long-term |

---

## Phase 8 — Critical Tech Debt

> **Goal:** Eliminate blockers and security risks before any production or beta release.  
> **Estimated Duration:** 1-2 weeks  
> **Branch Prefix:** `fix/`

---

### 8.1 — Production Environment Configuration ✅ DONE

**Problem:** `frontend/src/environments/environment.prod.ts` hardcodes `http://localhost:3000/api` as the production API URL. Any production build will point to localhost.

**Scope:** Frontend only  
**Effort:** 1-2 hours  
**Branch:** `fix/prod-environment-config`

#### Implementation Plan

1. **Update `environment.prod.ts`**
   - Replace hardcoded localhost with a placeholder or environment-injected variable
   - Use `__API_BASE_URL__` token that gets replaced at Docker build time, or read from `window.__env`
2. **Create runtime config loader**
   - Add `assets/config/app-config.json` with `{ "apiBaseUrl": "", "wsUrl": "" }`
   - Create `AppConfigService` that loads this JSON at `APP_INITIALIZER` time
   - Docker/nginx can mount the real config at deploy time
3. **Update `Dockerfile.build`**
   - Accept `API_BASE_URL` as a build arg
   - Use `envsubst` or `sed` in the nginx entrypoint to inject the value into `app-config.json`
4. **Update `docker-compose.yml`**
   - Add `API_BASE_URL` environment variable for the frontend service

#### Acceptance Criteria
- [x] `ng build --configuration=production` does NOT contain `localhost`
- [x] API URL is configurable at deploy time without rebuilding the image
- [x] Existing `docker-compose up` still works for local dev

---

### 8.2 — Gamification Auth & Hardcoded User ✅ DONE

**Problem:** `backend/src/gamification/gamification.controller.ts` has `@UseGuards(JwtAuthGuard)` commented out and `const userId = 1` hardcoded. Any user can submit predictions as user 1.

**Scope:** Backend only  
**Effort:** 1-2 hours  
**Branch:** `fix/gamification-auth`

#### Implementation Plan

1. **Restore JWT guard** — uncomment `@UseGuards(JwtAuthGuard)` on the controller class
2. **Extract user from token** — replace `const userId = 1` with `req.user.id` from the JWT payload
3. **Add `@CurrentUser()` decorator** — reuse from `common/decorators/` (see item 11.4)
4. **Update all gamification endpoints** to use the authenticated user's ID
5. **Add unit tests** — verify 401 without token, verify correct user ID propagation

#### Acceptance Criteria
- [x] All gamification endpoints require a valid JWT
- [x] Predictions are linked to the authenticated user
- [x] Unauthenticated requests return 401

---

### 8.3 — Stripe Placeholder Price ID ✅ DONE

**Problem:** `backend/src/payments/payments.controller.ts` contains a hardcoded placeholder Stripe price ID (`price_1Qj...`) that will never resolve to a real product.

**Scope:** Backend only  
**Effort:** 2-3 hours  
**Branch:** `fix/stripe-config`

#### Implementation Plan

1. **Add env vars** to Joi validation schema in `app.module.ts`:
   - `STRIPE_SECRET_KEY` (required)
   - `STRIPE_WEBHOOK_SECRET` (required)
   - `STRIPE_PRO_PRICE_ID` (required)
   - `FRONTEND_URL` (required, for checkout success/cancel URLs)
2. **Inject via `ConfigService`** in `PaymentsService` — remove hardcoded values
3. **Add `.env.example` entries** for all Stripe vars
4. **Verify webhook raw-body middleware** — ensure `express.raw()` in `payments.module.ts` doesn't conflict with global body parser; add integration test
5. **Add payment verification** — `PaymentSuccessPage` on frontend should call `GET /api/payments/verify-session/:sessionId` to confirm payment server-side

#### Acceptance Criteria
- [x] App fails to start if Stripe env vars are missing
- [x] No hardcoded price IDs in source code
- [x] Frontend verifies payment status server-side before showing success

---

### 8.4 — Auth Token Security ✅ DONE

**Problem:** JWT tokens stored in `localStorage` are vulnerable to XSS. No refresh token rotation is implemented.

**Scope:** Frontend + Backend  
**Effort:** 1 week  
**Branch:** `fix/auth-token-security`

#### Implementation Plan

**Backend:**
1. **Refresh token rotation** — on `/auth/refresh`, issue a new refresh token and invalidate the old one
2. **Set refresh token as HttpOnly cookie** — `Set-Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict; Path=/api/auth/refresh`
3. **Short-lived access tokens** — reduce JWT expiry to 15 minutes
4. **Add `/auth/refresh` endpoint** that reads the HttpOnly cookie (no body param needed)

**Frontend:**
1. **Store access token in memory only** (variable / BehaviorSubject, NOT localStorage)
2. **Auto-refresh** — `AuthInterceptor` detects 401, calls `/auth/refresh` (cookie sent automatically), retries original request
3. **Remove `localStorage.setItem('token', ...)` calls** from `AuthService`
4. **On app init** — call `/auth/refresh` to silently restore session

#### Acceptance Criteria
- [x] No tokens in `localStorage` or `sessionStorage`
- [x] Refresh tokens are HttpOnly cookies
- [x] Access tokens auto-refresh transparently
- [x] Logout clears the cookie server-side

---

### 8.5 — Duplicate Code Cleanup ✅ DONE

**Problem:** Several duplicated files cause confusion and risk divergence.

**Scope:** Backend + Frontend  
**Effort:** 2-3 hours  
**Branch:** `fix/duplicate-cleanup`

#### Items
| Duplicate | Keep | Remove |
|---|---|---|
| `auth/refresh-token.entity.ts` vs `auth/entities/refresh-token.entity.ts` | Root-level (imported by module) | `entities/` copy |
| `core/services/web-socket.service.ts` vs `services/websocket.service.ts` | Consolidate into `core/services/` | `services/websocket.service.ts` |
| `core/models/user.model.ts` vs `models/user.model.ts` | `core/models/` | `models/user.model.ts` |

#### Implementation Plan
1. **Identify all import references** for each duplicate using `grep`
2. **Update imports** to point to the kept file
3. **Delete the duplicate**
4. **Run tests** to verify nothing breaks

---

### 8.6 — Backend TypeScript Upgrade ✅ DONE

**Problem:** Backend uses TypeScript `^4.9.5` while NestJS 11 recommends 5.x.

**Scope:** Backend  
**Effort:** 3-4 hours  
**Branch:** `fix/backend-ts-upgrade`

#### Implementation Plan
1. `npm install typescript@~5.8.0 --save-dev` in `backend/`
2. Update `tsconfig.json` — enable `"moduleResolution": "bundler"` if needed, add `"verbatimModuleSyntax": true`
3. Fix any new type errors (likely minor)
4. Remove `sqlite3` from `dependencies` while at it
5. Run full test suite + build

---

### 8.7 — Console Log Cleanup ✅ DONE

**Problem:** 40+ `console.log/warn/error` calls scattered across the frontend. These leak info and clutter the browser console.

**Scope:** Frontend  
**Effort:** 3-4 hours  
**Branch:** `fix/console-log-cleanup`

#### Implementation Plan
1. **Create `LoggerService`** (or enhance existing `ErrorLoggingService`) with `debug()`, `info()`, `warn()`, `error()` methods
2. **In production mode** — suppress `debug` and `info` logs
3. **Find & replace** all `console.*` calls with `LoggerService` equivalents
4. **Add ESLint rule** `no-console: "warn"` to prevent future regressions

---

## Phase 9 — Core Missing Features

> **Goal:** Implement essential features users expect from a production-ready app.  
> **Estimated Duration:** 4-6 weeks  
> **Branch Prefix:** `feature/`

---

### 9.1 — Forgot Password / Reset Flow ✅ DONE

**Problem:** No way for users to recover their account if they forget their password.

**Scope:** Backend + Frontend  
**Effort:** 1 week  
**Branch:** `feature/forgot-password`

#### Architecture

```
Backend:
  POST /api/auth/forgot-password    { email }          → sends reset email
  POST /api/auth/reset-password     { token, password } → resets password

New Entity:
  PasswordResetToken
  ├── id (PK)
  ├── userId (FK → User)
  ├── token (UUID, hashed in DB)
  ├── expiresAt (30 min from creation)
  └── usedAt (nullable, prevents reuse)

Frontend:
  /auth/forgot-password   → email input form
  /auth/reset-password    → new password form (token from URL query param)
```

#### Implementation Plan

**Backend (4 tasks):**
1. Create `PasswordResetToken` entity with migration
2. Add `POST /auth/forgot-password` — generate token, hash it, store in DB, send email via `NodemailerService` (or a simple SMTP integration)
3. Add `POST /auth/reset-password` — validate token, hash new password, update user, mark token as used
4. Add email template (plain text + HTML) for the reset link

**Frontend (3 tasks):**
1. Create `ForgotPasswordPage` — email input, success message
2. Create `ResetPasswordPage` — reads `?token=` from URL, new password + confirm fields
3. Add "Forgot password?" link on `LoginPage`

**Email Service (new):**
1. Add `@nestjs-modules/mailer` or `nodemailer` dependency
2. Create `MailModule` with configurable SMTP settings
3. Add env vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`

#### Acceptance Criteria
- [x] User receives email within 30 seconds of submitting forgot-password
- [x] Reset token expires after 30 minutes
- [x] Token can only be used once
- [x] Password validation (min 8 chars, complexity rules)
- [x] Success redirects to login page with a flash message

---

### 9.2 — Notification Center / Inbox ✅ DONE

**Problem:** Alerts show as ephemeral toasts only. Users miss important notifications (new followers, reactions, match events).

**Scope:** Frontend (backend already complete)  
**Effort:** 1 week  
**Branch:** `feature/notification-center`

#### Existing Backend Support
The backend `AlertsService` already provides:
- `GET /api/alerts` — list user alerts (paginated)
- `GET /api/alerts/unread-count` — unread count
- `PATCH /api/alerts/:id/read` — mark as read
- `PATCH /api/alerts/read-all` — mark all as read
- `DELETE /api/alerts/:id` — delete single alert

#### Architecture

```
Frontend:
  Components:
    NotificationBellComponent     → header icon + unread badge count
    NotificationListComponent     → full-page list of notifications
    NotificationItemComponent     → single notification row (icon, text, timestamp, read state)

  Pages:
    /notifications                → NotificationListComponent (full page)

  Service:
    NotificationCenterService
    ├── unreadCount$: Observable<number>
    ├── notifications$: Observable<Alert[]>
    ├── loadNotifications(page: number)
    ├── markAsRead(id: number)
    ├── markAllAsRead()
    └── delete(id: number)
```

#### Implementation Plan

1. **Create `NotificationCenterService`**
   - On init, fetch unread count
   - Listen to WebSocket `social` namespace for real-time new alerts
   - Expose `unreadCount$` BehaviorSubject
2. **Create `NotificationBellComponent`**
   - Display bell icon in the app header bar
   - Show red badge with unread count (hide if 0)
   - Click navigates to `/notifications`
3. **Create `NotificationListComponent`**
   - Infinite-scroll list of notifications
   - Group by date (Today, Yesterday, Earlier)
   - Swipe-to-delete (Ionic gesture)
   - "Mark all as read" button in toolbar
4. **Create `NotificationItemComponent`**
   - Icon per alert type (FOLLOWER → person-add, REACTION → heart, COMMENT → chatbubble, MENTION → at, SYSTEM → information-circle)
   - Unread items have bold text + accent background
   - Tap marks as read + navigates to relevant content
5. **Add route** `/notifications` in `app.routes.ts`
6. **Integrate bell** into `NavigationMenuComponent` and `PageHeaderComponent`

#### Acceptance Criteria
- [x] Bell icon shows correct unread count
- [x] Real-time: new alert increments count without refresh
- [x] Tapping a notification navigates to the correct content (match, profile, etc.)
- [x] "Mark all as read" works
- [x] Infinite scroll loads older notifications

---

### 9.3 — User Settings & Preferences Page ✅ DONE

**Problem:** Backend has full User Profile and Preferences APIs, but the frontend has no settings page.

**Scope:** Frontend  
**Effort:** 1 week  
**Branch:** `feature/user-settings`

#### Existing Backend Support
- `GET/PUT /api/users/:id/profile` — display name, bio, avatar
- `GET/PUT /api/users/:id/preferences` — theme, language, notifications, favorite teams
- `POST /api/users/:id/avatar` — multipart upload
- `DELETE /api/users/:id/avatar` — remove avatar

#### Architecture

```
Frontend:
  Pages:
    /settings                     → SettingsPage (tab-based layout)
      ├── Profile Tab             → avatar, display name, bio
      ├── Preferences Tab         → theme, language, timezone
      ├── Notifications Tab       → push on/off per event type
      └── Account Tab             → change password, delete account

  Components:
    AvatarUploadComponent         → camera/gallery picker + crop + upload
    ThemeToggleComponent           → light/dark/auto toggle
    LanguageSelectorComponent      → dropdown with flag icons (reuse in settings)
```

#### Implementation Plan

1. **Create `SettingsPage`** with `ion-segment` tabs (Profile / Preferences / Notifications / Account)
2. **Profile Tab:**
   - Avatar upload with `Camera` (Capacitor) or file input on web
   - Crop/preview before upload
   - Display name and bio fields with save button
3. **Preferences Tab:**
   - Theme toggle (light / dark / auto) — persist via API + apply immediately via `document.body.classList`
   - Language selector — call existing `LanguageService.setLanguage()` + persist to API
   - Timezone selector
   - Favorite teams — searchable multi-select
4. **Notifications Tab:**
   - Master toggle: push notifications on/off
   - Per-type toggles: match start, goals, full-time, new follower, comments on my predictions
   - Save to preferences API
5. **Account Tab:**
   - Change password form (current password + new password + confirm)
   - Delete account button with confirmation modal
6. **Add route** `/settings` and navigation menu link
7. **Connect to `LanguageService` and theme service** for immediate effect

#### Acceptance Criteria
- [x] Avatar upload works on web and mobile (Capacitor)
- [x] Theme change applies immediately and persists across sessions
- [x] Language change applies to entire UI and persists
- [x] Notification preferences are saved server-side

---

### 9.4 — Search & Discovery ✅ DONE

**Problem:** `SearchOverlayComponent` exists but has no backend support or results page. Users can't discover teams, matches, or other users.

**Scope:** Backend + Frontend  
**Effort:** 1–2 weeks  
**Branch:** `feature/search`

#### Architecture

```
Backend:
  GET /api/search?q=barcelona&type=all     → unified search
  GET /api/search?q=barcelona&type=teams   → teams only
  GET /api/search?q=messi&type=users       → users only
  GET /api/search?q=final&type=matches     → matches only

  SearchModule:
    SearchService
    ├── searchAll(query, limit)            → combined results
    ├── searchTeams(query, limit)          → DB ILIKE + Football API fallback
    ├── searchUsers(query, limit)          → DB ILIKE on displayName
    └── searchMatches(query, limit)        → DB ILIKE on team names / competition

Frontend:
  Pages:
    /search                               → SearchResultsPage
  
  Components:
    EnhancedSearchOverlayComponent
    ├── debounced input (300ms)
    ├── type filter chips (All / Teams / Matches / Users)
    ├── recent searches (localStorage, max 10)
    └── results list with section headers
```

#### Implementation Plan

**Backend (3 tasks):**
1. Create `SearchModule` with `SearchService` doing `ILIKE '%query%'` across teams, users, and matches
2. Create `SearchController` with `GET /api/search` endpoint
3. Add pagination support and result scoring (exact match > partial)

**Frontend (4 tasks):**
1. Enhance `SearchOverlayComponent` — add debounce, type filter chips, recent searches
2. Create `SearchResultsPage` at `/search?q=...&type=...`
3. Result item components per type (team card, user card, match card)
4. Save recent searches to localStorage and display on empty state

#### Acceptance Criteria
- [x] Search returns results within 500ms
- [x] Results grouped by type with counts
- [x] Recent searches shown on focus (max 10, clearable)
- [x] Clicking a result navigates to the correct detail page

---

### 9.5 — Comment Reply Threading ✅ DONE

**Problem:** `comment-list.component.ts` has `// TODO: Load replies for this comment`. Reply UI is stubbed but non-functional.

**Scope:** Backend + Frontend  
**Effort:** 3-5 days  
**Branch:** `feature/comment-threading`

#### Architecture

The `Comment` entity likely already has a `parentId` field. The plan is:

```
Backend:
  GET /api/comments/:matchId              → top-level comments (parentId IS NULL)
  GET /api/comments/:commentId/replies    → replies to a specific comment
  POST /api/comments                      → { matchId, content, parentId? }

Frontend:
  CommentListComponent (enhanced)
  ├── Top-level comments
  │   ├── "N replies" collapse/expand link
  │   └── Nested CommentListComponent (1 level deep max)
  └── Reply input (appears inline under a comment)
```

#### Implementation Plan

**Backend (2 tasks):**
1. Add `GET /api/comments/:commentId/replies` endpoint (paginated)
2. Ensure `POST /api/comments` accepts optional `parentId` and validates it exists

**Frontend (3 tasks):**
1. Add "Reply" button to each comment → shows inline reply form
2. Add "View N replies" link → fetches and displays nested replies (1 level deep)
3. Style nested replies with indentation and vertical connector line

#### Acceptance Criteria
- [x] Users can reply to any top-level comment
- [x] Replies appear indented below the parent
- [x] Reply count is displayed and updates in real-time
- [x] Max 1 level of nesting (replies to replies become top-level of thread)

---

### 9.6 — Proper Error & 404 Pages ✅ DONE

**Problem:** Wildcard route redirects to home. Users hitting a bad URL get no feedback. Component errors are unhandled.

**Scope:** Frontend  
**Effort:** 2-3 days  
**Branch:** `feature/error-pages`

#### Implementation Plan

1. **Create `NotFoundPage` (`/404`)**
   - Friendly illustration + "Page not found" message
   - "Go Home" button
   - Search bar to help user find what they wanted
2. **Create `ErrorPage` (`/error`)**
   - Generic error illustration
   - "Something went wrong" message
   - "Try Again" + "Go Home" buttons
3. **Update wildcard route** in `app.routes.ts`: `{ path: '**', redirectTo: '404' }`
4. **Enhance `GlobalErrorHandler`**
   - Catch uncaught component errors
   - Display toast for recoverable errors
   - Navigate to `/error` for critical failures

#### Acceptance Criteria
- [x] Unknown URLs show 404 page (not a blank redirect)
- [x] 404 page has a link back to home
- [x] `/error` page is reachable after critical failures

---

## Phase 10 — Engagement & Polish

> **Goal:** Maximize user engagement through gamification, social enhancements, and content.  
> **Estimated Duration:** 4-6 weeks  
> **Branch Prefix:** `feature/`

---

### 10.1 — Badge & Achievement System ✅ DONE

**Problem:** `Badge` and `Leaderboard` entities are registered in the backend but completely unused. The gamification module only handles predictions.

**Scope:** Backend + Frontend  
**Effort:** 2 weeks  
**Branch:** `feature/badges`

#### Architecture

```
Backend:
  badge.entity.ts (existing — enhance)
  ├── id, name, description, iconUrl
  ├── criteria (JSON: { type: 'predictions_correct', threshold: 10 })
  └── tier: 'bronze' | 'silver' | 'gold' | 'platinum'

  user-badge.entity.ts (new)
  ├── userId, badgeId, unlockedAt

  BadgeService
  ├── checkAndAward(userId, eventType)   → called after events
  ├── getUserBadges(userId)
  └── getAvailableBadges()

  Seed data: 15-20 default badges

Frontend:
  BadgeDisplayComponent            → single badge (icon + name + tier color)
  BadgeGalleryPage (/badges)       → all badges with locked/unlocked state
  AchievementToastComponent        → animated popup when badge unlocked
  ProfileBadgesSection             → show on user profile page
```

#### Badge Categories (Seed Data)

| Badge | Criteria | Tier |
|---|---|---|
| Crystal Ball | 1 correct prediction | Bronze |
| Oracle | 10 correct predictions | Silver |
| Prophet | 50 correct predictions | Gold |
| First Comment | Post first comment | Bronze |
| Social Butterfly | Follow 10 users | Silver |
| Streak Master | 5 correct predictions in a row | Gold |
| Early Bird | Predict before match day | Bronze |
| Devoted Fan | Log in 30 days in a row | Gold |
| Pro Supporter | Subscribe to Pro | Silver |
| Top 10 Weekly | Finish in weekly top 10 | Gold |

#### Implementation Plan

**Backend (5 tasks):**
1. Enhance `Badge` entity with `criteria` JSON column and `tier` enum
2. Create `UserBadge` join entity + migration
3. Create `BadgeService` with `checkAndAward()` logic
4. Hook into events: prediction scored → check prediction badges; comment created → check social badges; login → check streak
5. Seed 15-20 default badges via migration or seed script

**Frontend (4 tasks):**
1. Create `BadgeDisplayComponent` — icon, name, tier-colored border
2. Create `BadgeGalleryPage` — grid of all badges, locked ones grayed out with progress bar
3. Create achievement unlock toast/animation (confetti + badge icon)
4. Add badges section to `UserProfilePage`

#### Acceptance Criteria
- [x] Badges are automatically awarded when criteria are met
- [x] Users see an animated notification when they unlock a badge
- [x] Badge gallery shows progress toward locked badges
- [x] Badges appear on user profiles

---

### 10.2 — Live Match Chat Enhancements ✅ DONE

**Problem:** Match chat exists but is basic — text-only, no moderation, no context.

**Scope:** Backend + Frontend  
**Effort:** 1 week  
**Branch:** `feature/chat-enhancements`

#### Implementation Plan

1. **Auto-event messages** — when a goal/card/substitution occurs, inject a system message into the chat (e.g., "⚽ GOAL! Messi scores at 73'")
2. **Quick reactions** — emoji overlay (🎉 😱 😡 ❤️ 👏) sent as lightweight reaction events (not full messages)
3. **Admin moderation** — mute user, delete message, pin message
4. **Typing indicator** — "3 people typing..." below the chat input
5. **Message formatting** — support basic markdown (bold, italic) and @mentions with user linking

#### Acceptance Criteria
- [x] Match events appear as system messages in real-time
- [x] Quick reactions display as floating emoji overlay
- [x] Admins can mute/delete/pin from context menu

---

### 10.3 — Match Lineups & Player Stats ✅ DONE

**Problem:** Match detail page shows scores and basic info but no lineups or player data.

**Scope:** Backend + Frontend  
**Effort:** 1-2 weeks  
**Branch:** `feature/lineups-players`

#### Architecture

```
Backend:
  PlayerModule (new)
  ├── player.entity.ts              → name, position, nationality, teamId
  ├── player-stats.entity.ts        → goals, assists, cards, minutes per season
  ├── player.service.ts             → CRUD + sync from football API
  └── player.controller.ts          → GET /api/players/:id, GET /api/teams/:id/players

  MatchModule (enhance)
  ├── GET /api/matches/:id/lineups  → starting XI + substitutes

Frontend:
  LineupComponent                   → pitch visualization with player positions
  PlayerCardComponent               → photo, name, position, key stats
  PlayerProfilePage (/players/:id)  → full stats, career history
  PlayerComparisonComponent         → side-by-side stats comparison
```

#### Implementation Plan

**Backend (4 tasks):**
1. Create `Player` and `PlayerStats` entities with migration
2. Extend `FootballApiService` to fetch lineups and player data
3. Create `PlayerModule` with CRUD service and controller
4. Add `GET /api/matches/:id/lineups` to matches controller

**Frontend (4 tasks):**
1. Create `LineupComponent` — football pitch SVG with player dots at positions
2. Create `PlayerCardComponent` — compact card with photo, name, key stats
3. Create `PlayerProfilePage` — full player stats page
4. Integrate lineups section into `MatchDetailsPage`

#### Acceptance Criteria
- [x] Match detail page shows starting XI for both teams
- [x] Tapping a player opens their profile page
- [x] Player profiles show season stats (goals, assists, cards, minutes)

---

### 10.4 — Favorites & Personalized Dashboard ✅ DONE

**Problem:** Dashboard shows generic match data. No way to follow specific teams/leagues for a personalized experience.

**Scope:** Backend + Frontend  
**Effort:** 1 week  
**Branch:** `feature/favorites`

#### Architecture

```
Backend:
  UserPreferences.favoriteTeamIds (existing JSON column)
  
  New endpoints:
    POST /api/users/me/favorites/:teamId      → add favorite
    DELETE /api/users/me/favorites/:teamId     → remove favorite
    GET /api/users/me/favorites                → list favorites
    GET /api/matches/personalized              → upcoming matches for favorite teams

Frontend:
  "★" toggle on TeamCardComponent
  Personalized Home tab — upcoming matches for favorite teams
  Onboarding flow — "Pick your teams" screen after first login
```

#### Implementation Plan

1. **Backend:** Add favorite team CRUD endpoints (leverage existing `favoriteTeamIds` JSON column)
2. **Backend:** Add `GET /api/matches/personalized` — filter upcoming matches by user's favorite team IDs
3. **Frontend:** Add star/heart toggle to `TeamCardComponent`
4. **Frontend:** Create "My Matches" section on home page showing upcoming matches for favorites
5. **Frontend:** Create onboarding prompt after first login — "Select your favorite teams"
6. **Push notifications:** filter match notifications to only send for favorited teams (unless user opts into all)

#### Acceptance Criteria
- [x] Users can favorite/unfavorite teams from any team card
- [x] Home page shows personalized "upcoming" section for favorites
- [x] First-time users see onboarding team picker

---

### 10.5 — Data Export & Social Sharing ✅ DONE

**Problem:** Backend has `DataExportController` but no frontend. Users can't share their predictions or stats.

**Scope:** Frontend  
**Effort:** 3-5 days  
**Branch:** `feature/data-export`

#### Implementation Plan

1. **Export Predictions** — "Download CSV" button on leaderboard/profile (call `GET /api/analytics/export/predictions?format=csv`)
2. **Shareable Prediction Card** — generate a styled canvas/image of a prediction result; share via `navigator.share()` or download
3. **Deep Links** — clicking a shared link opens the correct match/prediction page (configure Angular route params)
4. **OG Meta Tags** — server-side rendering or prerender for social media previews (future SSR consideration)

#### Acceptance Criteria
- [x] Users can download prediction history as CSV
- [x] "Share" button generates a shareable image or link
- [x] Shared links open the correct content in the app

---

### 10.6 — Offline Mode & Caching Strategy ✅ DONE

**Problem:** PWA shell caches assets but no API data. App is blank when offline.

**Scope:** Frontend  
**Effort:** 1 week  
**Branch:** `feature/offline-mode`

#### Implementation Plan

1. **API response caching** — use service worker `dataGroups` in `ngsw-config.json` for:
   - Matches list: cache-first, refresh in background, max-age 1h
   - Team data: cache-first, max-age 24h
   - User profile: cache-first, max-age 7d
2. **Offline banner** — detect `navigator.onLine` changes, show `ion-toast` with "You're offline — showing cached data"
3. **Queued actions** — when offline, queue predictions/comments in IndexedDB; sync when back online with conflict resolution
4. **Last-updated timestamps** — show "Data from 2 hours ago" below each section

#### Acceptance Criteria
- [x] App shows cached match data when offline
- [x] Offline banner appears/disappears correctly
- [x] Queued actions sync automatically when back online

---

## Phase 11 — Architecture & Quality

> **Goal:** Ensure stability, security, and maintainability.
> **Estimated Duration:** 2 weeks
> **Branch Prefix:** `chore/` or `refactor/`

---

### 11.1 — Rate Limiting ✅ DONE

**Problem:** No rate limiting on any endpoint. Auth endpoints and payment APIs are unprotected against brute force.

**Scope:** Backend  
**Effort:** 2-3 hours  
**Branch:** `chore/rate-limiting`

#### Implementation Plan

1. `npm install @nestjs/throttler`
2. Add `ThrottlerModule.forRoot({ ttl: 60_000, limit: 100 })` globally
3. Override for sensitive endpoints:
   - `POST /auth/login` → 5 per minute
   - `POST /auth/register` → 3 per minute
   - `POST /auth/forgot-password` → 3 per minute
   - `POST /payments/*` → 10 per minute
4. Return `429 Too Many Requests` with `Retry-After` header

#### Acceptance Criteria
- [x] Brute-force login attempts are blocked after 5 tries
- [x] Global default is 100 req/min per IP
- [x] 429 responses include `Retry-After` header

---

### 11.2 — Health Check Endpoint ✅ DONE

**Problem:** No `/health` endpoint for container orchestration probes.

**Scope:** Backend  
**Effort:** 1-2 hours  
**Branch:** `chore/health-check`

#### Implementation Plan

1. `npm install @nestjs/terminus`
2. Create `HealthModule` with:
   - `TypeOrmHealthIndicator` — DB connectivity
   - `HttpHealthIndicator` — Football API reachability
   - `MemoryHealthIndicator` — heap/RSS thresholds
3. Expose `GET /health` (unauthenticated)
4. Update `docker-compose.yml` with `healthcheck` directives
5. Update deployment workflow smoke tests to hit `/health`

#### Acceptance Criteria
- [x] `GET /health` returns `{ status: 'ok', details: {...} }`
- [x] Returns 503 if DB is unreachable
- [x] Docker compose uses the health endpoint

---

### 11.3 — Test Coverage Improvement ✅ DONE

**Problem:** Coverage thresholds are 30%. Several critical modules (payments, gamification, social services, WebSocket gateways) have zero tests.

**Scope:** Backend + Frontend  
**Effort:** 2 weeks (on-going)  
**Branch:** `chore/test-coverage`

#### Priority Test Targets

**Backend (zero coverage → must add):**
| Module | Target Files | Estimated Tests |
|---|---|---|
| Payments | `payments.service.ts`, `payments.controller.ts` | 20+ |
| Gamification | `gamification.service.ts`, `gamification.scheduler.ts` | 15+ |
| Social Feed | `feed.service.ts`, `follow.service.ts`, `reactions.service.ts` | 20+ |
| Chat Gateway | `chat.gateway.ts` | 10+ |
| WebSocket | `match.gateway.ts`, `social.gateway.ts` | 10+ |

**Frontend (zero coverage → must add):**
| Area | Target Files | Estimated Tests |
|---|---|---|
| Pages | `login.page.ts`, `teams.page.ts`, `matches.page.ts`, `leaderboard.page.ts` | 10+ each |
| Services | `analytics.service.ts`, `chat.service.ts`, `gamification.service.ts`, `subscription.service.ts` | 10+ each |
| Components | `analytics-charts/*`, `match-chat/*`, `prediction-card/*`, `prediction-voting/*` | 5+ each |

#### Milestones
| Milestone | Target Coverage | Deadline |
|---|---|---|
| M1 | 50% statements, 40% branches | +2 weeks |
| M2 | 65% statements, 55% branches | +4 weeks |
| M3 | 80% statements, 70% branches | +8 weeks |

---

### 11.4 — Shared `@CurrentUser()` Decorator ✅ DONE

**Problem:** `CurrentUser` param decorator is defined inline in `payments.controller.ts` instead of being in `common/`.

**Scope:** Backend  
**Effort:** 30 minutes  
**Branch:** `refactor/current-user-decorator`

#### Implementation Plan

1. Create `backend/src/common/decorators/current-user.decorator.ts`
2. Move the `createParamDecorator` logic there
3. Update imports in `payments.controller.ts` and anywhere else it's needed
4. Export from a `common/decorators/index.ts` barrel

---

### 11.5 — Event-Driven Gamification Scoring ✅ DONE

**Problem:** `gamification.scheduler.ts` runs every 60 seconds querying all unscored predictions — wasteful at scale.

**Scope:** Backend  
**Effort:** 3-4 hours  
**Branch:** `refactor/gamification-events`

#### Implementation Plan

1. **Create `MatchFinishedEvent`** using NestJS `EventEmitter2`
2. **Emit from `LiveMatchService`** when a match transitions to `FINISHED` status
3. **Listen in `GamificationService`** — `@OnEvent('match.finished')` → score only predictions for that match
4. **Keep cron as fallback** — reduce to `EVERY_HOUR` for catching missed events
5. **Remove one-minute polling** from the scheduler

---

### 11.6 — Centralized State Management Evaluation ✅ DONE

**Scope:** Frontend  
**Effort:** Research 2-3 days, migration 1-2 weeks  

Currently the app uses a mix of Signals, BehaviorSubjects, and component-local state. As it grows, evaluate:

| Option | Pros | Cons |
|---|---|---|
| **NgRx SignalStore** | Official Angular, signal-based, lightweight | Learning curve, boilerplate |
| **NGXS** | Simple decorators, less boilerplate | Less Angular-native |
| **Keep current** | No migration cost | State scattered, hard to debug |

**Recommendation:** Start with `@ngrx/signals` for the most complex domains (auth, notifications, match state) and keep simple services for the rest.

---

### 11.7 — Strong Typing Cleanup ✅ DONE

**Problem:** Heavy use of `any` types across the frontend (match objects, API responses).

**Scope:** Frontend  
**Effort:** 3-5 days  
**Branch:** `refactor/strong-typing`

#### Implementation Plan

1. Audit all `any` usages: `grep -rn ': any' src/app/ | wc -l`
2. Create/update interfaces in `models/` for all API response shapes
3. Replace `any` with proper types, starting with the most-used ones (Match, Team, User, Comment)
4. Add `"noImplicitAny": true` to `tsconfig.json` (incremental — start with `strict: false` + `noImplicitAny: true`)
5. Fix all resulting type errors

---

## Phase 12 — State Management Migration

> **Goal:** Standardize global state management using NgRx to improve predictability, debugging, and testability across the application.
> **Estimated Duration:** 3-4 weeks (Incremental)
> **Branch Prefix:** `refactor/ngrx-`

### 12.1 — Migration Strategy & Standards
**Scope:** Architecture / Documentation
**Effort:** 3 days
- [x] Create `docs/state-management.md` defining:
    - Criteria for Global (NgRx) vs Local (Component/Signal) state.
    - Folder structure (`store/{feature}/*.{actions,reducer,effects,selectors}.ts`).
    - Naming conventions.
- [x] Establish `BaseFacade` or facade patterns to hide Store dispatch from components.
- [x] Add `.github/pull_request_template.md` with state migration checklist.

### 12.2 — Auth State Migration
**Scope:** Frontend
**Effort:** 3 days
- [x] Create `AuthStore` (Actions/Reducers) for `user`, `token`, `isAuthenticated`.
- [x] Move `AuthService` logic into `AuthEffects`.
- [x] Update `AuthGuard` and `AuthInterceptor` to use Store Selectors.
- [x] Deprecate behavior subjects in `AuthService` (facade pattern adopted).

### 12.3 — Notification State
**Scope:** Frontend
**Effort:** 2 days
- [x] Create `NotificationStore` (NgRx SignalStore).
- [x] Handle WebSocket events via `rxMethod` (listenForRealTimeAlerts).
- [x] Store unread count and list in SignalStore state.

### 12.4 — Payment & Subscription State
**Scope:** Frontend
**Effort:** 2 days
- [x] Create `BillingStore` (NgRx SignalStore).
- [x] Manage subscription status, history, checkout and payment loading states.

### 12.5 — Offline Queue Integration
**Scope:** Frontend
**Effort:** 4 days
- [x] Integrate `OfflineQueueService` with NgRx SignalStore (`OfflineStore`).
- [x] Methods: `addToQueue`, `removeFromQueue`, `flush` (replaces action constants).
- [x] Hydrate state from LocalStorage via `withHooks({ onInit })`.

---

## Phase 13 — Future Vision

> **Goal:** Long-term R&D and major platform expansions.
> **Estimated Duration:** 6-8 weeks (incremental)
> **Status:** 🔄 IN PROGRESS
> **Branch Prefix:** `feature/`

---

### 13.1 — ML Prediction Model 🟡 P2

**Problem:** The ML prediction microservice exists (`ml-services/prediction-model/`) with a FastAPI scaffold and statistical fallback, but has no trained model, no BTTS/Over-Under endpoints, and no backend integration from NestJS.

**Scope:** Python Microservice + Backend Integration
**Effort:** 2 weeks
**Branch:** `feature/ml-prediction`

#### Existing Infrastructure
- FastAPI app at `ml-services/prediction-model/app/main.py` — `/predict`, `/health`, `/model/info`, `/model/reload`
- `MatchPredictor` with XGBoost + statistical fallback
- `FeatureEngineer` with 18-feature vector
- `train_model.py` training script consuming FootDash API export
- `docker-compose.ml.yml` for standalone ML container
- Backend `ml-prediction.service.ts` + `data-export.controller.ts` (training-data export)

#### Architecture

```
ML Service (FastAPI):
  POST /predict              → match outcome (existing, enhanced)
  POST /predict/btts         → Both Teams To Score prediction
  POST /predict/over-under   → Over/Under 2.5 goals prediction
  POST /predict/batch        → batch predictions for multiple matches
  GET  /model/metrics        → accuracy, precision, recall, F1 per market
  GET  /model/retrain-status → last training run info

NestJS Backend:
  MlIntegrationModule (new)
  ├── MlIntegrationService      → HTTP calls to ML service
  ├── MlIntegrationController   → GET /api/predictions/ml/:matchId
  └── MlCacheService            → Cache predictions (TTL 30min)
```

#### Implementation Plan

**ML Service Enhancements (4 tasks):**
1. Add `POST /predict/btts` endpoint — binary classifier for both-teams-to-score
2. Add `POST /predict/over-under` endpoint — over/under 2.5 goals prediction
3. Add `POST /predict/batch` endpoint — accept array of matches, return array of predictions
4. Add `GET /model/metrics` — model accuracy, precision, recall per prediction market
5. Write pytest suite for all endpoints

**Backend Integration (3 tasks):**
1. Create `MlIntegrationModule` — NestJS module with `HttpModule` calling ML service
2. Create `MlIntegrationService` — methods: `predictOutcome()`, `predictBtts()`, `predictOverUnder()`, `batchPredict()`
3. Create `GET /api/predictions/ml/:matchId` controller route — fetches team stats, calls ML service, returns prediction with confidence
4. Add caching layer (30-minute TTL) using in-memory cache

**Docker Integration (2 tasks):**
1. Add ML service to main `docker-compose.yml` as `ml-prediction` service
2. Add `ML_SERVICE_URL` env var to backend config

#### Acceptance Criteria
- [x] `POST /predict` returns outcome probabilities with confidence levels
- [x] `POST /predict/btts` returns BTTS probability
- [x] `POST /predict/over-under` returns over/under 2.5 probability
- [x] NestJS `GET /api/predictions/ml/:matchId` returns formatted ML prediction
- [x] Predictions are cached for 30 minutes
- [x] ML service health check integrated into main `/health` endpoint
- [x] All ML endpoints have pytest tests

---

### 13.2 — Fantasy League System 🟡 P2

**Problem:** No fantasy football feature. Users want to create leagues, draft players, earn points based on real match performance.

**Scope:** Full Stack
**Effort:** 3-4 weeks
**Branch:** `feature/fantasy-league`

#### Architecture

```
Backend Entities:
  FantasyLeague
  ├── id, name, ownerId (FK → User), code (invite), maxMembers, entryFee
  ├── scoringRules (JSON), status ('draft' | 'active' | 'completed')
  └── seasonId, leagueId

  FantasyTeam
  ├── id, userId (FK), leagueId (FK → FantasyLeague)
  ├── name, budget (default 100M), totalPoints
  └── formation ('4-3-3' | '4-4-2' | '3-5-2' | '3-4-3')

  FantasyRoster (join table)
  ├── fantasyTeamId, playerId (FK → Player)
  ├── position ('GK' | 'DEF' | 'MID' | 'FWD'), isCaptain, isViceCaptain
  └── purchasePrice, gameweek (added in)

  FantasyGameweek
  ├── id, leagueId, weekNumber, startDate, endDate
  ├── status ('upcoming' | 'live' | 'completed')
  └── processed (boolean)

  FantasyPoints
  ├── fantasyTeamId, playerId, gameweekId
  └── points, breakdown (JSON: { goals: 5, assists: 3, cleanSheet: 4 })

Backend Module:
  FantasyModule
  ├── FantasyLeagueService       → CRUD leagues, join/leave, invite codes
  ├── FantasyTeamService         → manage squad, transfers, captain selection
  ├── FantasyPointsService       → calculate points per gameweek
  ├── FantasySchedulerService    → cron to process gameweek results
  └── FantasyController          → REST endpoints

Frontend Pages:
  /fantasy                       → FantasyHomePage (my leagues + join/create)
  /fantasy/league/:id            → FantasyLeaguePage (standings, gameweek)
  /fantasy/league/:id/team       → FantasyTeamPage (pitch view, squad)
  /fantasy/league/:id/transfers  → TransferMarketPage (buy/sell players)
  /fantasy/league/:id/draft      → DraftPage (live draft room)
```

#### Scoring Rules (Default)

| Event | Points |
|-------|--------|
| Playing 60+ min | 2 |
| Goal (FWD) | 4 |
| Goal (MID) | 5 |
| Goal (DEF/GK) | 6 |
| Assist | 3 |
| Clean Sheet (DEF/GK) | 4 |
| Clean Sheet (MID) | 1 |
| Yellow Card | -1 |
| Red Card | -3 |
| Own Goal | -2 |
| Penalty Save | 5 |
| Penalty Miss | -2 |
| Captain | 2x points |

#### Implementation Plan

**Backend (5 tasks):**
1. Create entities: `FantasyLeague`, `FantasyTeam`, `FantasyRoster`, `FantasyGameweek`, `FantasyPoints` + migration
2. Create `FantasyLeagueService` — create league, generate invite code, join/leave
3. Create `FantasyTeamService` — assemble squad within budget, make transfers (max 2 free/week)
4. Create `FantasyPointsService` — after each gameweek, calculate points from real match data
5. Create `FantasyController` with endpoints:
   - `POST /api/fantasy/leagues` — create league
   - `POST /api/fantasy/leagues/:id/join` — join with invite code
   - `GET /api/fantasy/leagues` — list my leagues
   - `GET /api/fantasy/leagues/:id/standings` — league standings
   - `PUT /api/fantasy/teams/:id/squad` — set squad
   - `POST /api/fantasy/teams/:id/transfer` — make transfer
   - `GET /api/fantasy/gameweeks/:id/results` — gameweek results

**Frontend (4 tasks):**
1. Create `FantasyHomePage` — list leagues, create/join buttons
2. Create `FantasyLeaguePage` — standings table, gameweek navigation
3. Create `FantasyTeamPage` — pitch visualization, player cards, captain selector
4. Create `TransferMarketPage` — search players, budget tracker, transfer confirmation

#### Acceptance Criteria
- [x] Users can create private leagues with invite codes
- [x] Squad selection respects budget cap (100M default)
- [x] Points are calculated automatically after each gameweek
- [x] League standings update in real-time during live gameweeks
- [x] Maximum 2 free transfers per week (additional transfers cost points)
- [x] Captain earns double points

---

### 13.3 — Multi-League Support 🟠 P1

**Problem:** App currently focused on Premier League only. Match entity has `league` JSON column but no league browsing or filtering UI.

**Scope:** Backend + Frontend
**Effort:** 1-2 weeks
**Branch:** `feature/multi-league`

#### Supported Leagues (Initial)

| League | API ID | Country |
|--------|--------|---------|
| Premier League | 39 | England |
| La Liga | 140 | Spain |
| Serie A | 135 | Italy |
| Bundesliga | 78 | Germany |
| Ligue 1 | 61 | France |
| Champions League | 2 | Europe |
| Europa League | 3 | Europe |

#### Architecture

```
Backend:
  League Entity (new)
  ├── id, externalId, name, country, logo, season, isFeatured
  └── lastSyncAt

  FootballApiService (enhance)
  ├── getAvailableLeagues(country?: string)
  ├── getLeagueStandings(leagueId, season)
  └── getLeagueMatches(leagueId, season, round?)

  LeagueModule (new)
  ├── LeagueService       → CRUD + sync from API
  ├── LeagueController    → GET /api/leagues, GET /api/leagues/:id/standings
  └── LeagueSyncScheduler → daily sync of league metadata

Frontend:
  LeagueSelectorComponent     → dropdown/chips in header for league switching
  LeagueStandingsPage         → /leagues/:id/standings
  LeagueMatchesPage           → /leagues/:id/matches
  Enhanced Dashboard          → filter home page by selected league
```

#### Implementation Plan

**Backend (4 tasks):**
1. Create `League` entity with migration (id, externalId, name, country, logo, season, isFeatured)
2. Enhance `FootballApiService` — add `getLeagues()`, `getLeagueStandings()`, `getLeagueFixtures()`
3. Create `LeagueModule` with service/controller — `GET /api/leagues`, `GET /api/leagues/:id/standings`, `GET /api/leagues/:id/matches`
4. Add `LeagueSyncScheduler` — daily cron to refresh league metadata and standings

**Frontend (4 tasks):**
1. Create `LeagueSelectorComponent` — pill chips or dropdown to select active league
2. Create `LeagueStandingsPage` — full standings table with team logos, W/D/L, points, GD
3. Update `HomePage` to filter matches by selected league
4. Add league routes: `/leagues`, `/leagues/:id/standings`, `/leagues/:id/matches`

#### Acceptance Criteria
- [x] At least 5 major European leagues available
- [x] Users can switch leagues from any page via selector
- [x] League standings display with full table
- [x] Match listings filter by selected league
- [x] League data syncs daily from football API

---

### 13.4 — Native Mobile Apps 🟡 P2

**Problem:** Capacitor packages installed but not initialized. App works as PWA only — no native push, haptics, or app store presence.

**Scope:** Capacitor / Native
**Effort:** 1-2 weeks
**Branch:** `feature/native-mobile`

#### Architecture

```
Capacitor Config:
  capacitor.config.ts
  ├── appId: 'com.footdash.app'
  ├── appName: 'FootDash'
  ├── webDir: 'www'
  └── plugins: { PushNotifications, SplashScreen, StatusBar, Keyboard }

Platforms:
  ios/      → Xcode project (auto-generated)
  android/  → Android Studio project (auto-generated)

Push Notifications:
  FCM (Firebase Cloud Messaging)
  ├── Backend: FcmModule → send targeted push per user/topic
  ├── Frontend: PushNotificationService → register, handle tokens, receive
  └── Config: google-services.json (Android), GoogleService-Info.plist (iOS)
```

#### Implementation Plan

**Capacitor Setup (3 tasks):**
1. Run `npx cap init FootDash com.footdash.app --web-dir www`
2. Create `capacitor.config.ts` with plugin configuration (SplashScreen, StatusBar, Keyboard, PushNotifications)
3. Add `@capacitor/push-notifications`, `@capacitor/splash-screen`, `@capacitor/camera` packages

**Push Notifications — Backend (3 tasks):**
1. Add `firebase-admin` to backend dependencies
2. Create `FcmModule` with `FcmService` — `sendToUser(userId, title, body, data)`, `sendToTopic(topic, title, body)`
3. Create `POST /api/push/register` — store device FCM token linked to user
4. Integrate with alert system — when alert created, also push via FCM if user has token

**Push Notifications — Frontend (3 tasks):**
1. Create `PushNotificationService` — register with FCM, send token to backend, handle incoming push
2. Request notification permission on first login
3. Handle deep links from push notifications (navigate to match, notification center, etc.)

**In-App Purchases (future):**
1. Integrate RevenueCat SDK for cross-platform subscription management
2. Map to existing Stripe-based subscription tiers

#### Acceptance Criteria
- [x] `npx cap sync` runs without errors
- [x] App opens in iOS Simulator / Android Emulator
- [x] Push notifications received on device when alert triggers
- [x] Device token registered with backend on login
- [x] Deep links from push navigate to correct page
- [x] Status bar and splash screen configured per platform

---

### 13.5 — Video Highlights Integration 🔵 P3

**Problem:** Users want to watch match highlights without leaving the app.

**Scope:** Backend + Frontend
**Effort:** 1 week
**Branch:** `feature/video-highlights`

#### Architecture

```
Backend:
  HighlightsModule (new)
  ├── HighlightsService        → YouTube Data API v3 search
  ├── HighlightsController     → GET /api/matches/:id/highlights
  └── HighlightsCacheService   → cache results for 24h

Frontend:
  HighlightsPlayerComponent    → embedded YouTube iframe
  HighlightsCardComponent      → thumbnail + title + duration
  MatchDetailsPage (enhance)   → add "Highlights" tab for finished matches
```

#### Implementation Plan

**Backend (3 tasks):**
1. Add YouTube Data API v3 key to env config
2. Create `HighlightsService` — search YouTube for `"{homeTeam} vs {awayTeam} highlights {date}"`, return top 3 results
3. Create `GET /api/matches/:id/highlights` — auto-search based on match teams and date, cache results 24h

**Frontend (3 tasks):**
1. Create `HighlightsPlayerComponent` — responsive YouTube embed (iframe with `lite-youtube-embed` for performance)
2. Create `HighlightsCardComponent` — thumbnail grid card
3. Add "Highlights" tab/section to `MatchDetailsPage` for completed matches

#### Acceptance Criteria
- [x] Completed matches show relevant YouTube highlights
- [x] Highlights are cached for 24 hours
- [x] Video player is responsive and lazy-loaded
- [x] No highlights shown for upcoming or live matches

---

### 13.6 — Real-time Betting Odds 🔵 P3

**Problem:** Users want to see betting odds from major bookmakers alongside predictions to identify value bets.

**Scope:** Backend + Frontend
**Effort:** 1-2 weeks
**Branch:** `feature/betting-odds`

#### Architecture

```
Backend:
  OddsModule (new)
  ├── OddsApiService            → integrates with The Odds API (odds-api.com)
  ├── OddsController            → GET /api/matches/:id/odds
  ├── ValueBetService           → compare ML prediction vs bookmaker odds
  └── OddsCacheService          → cache odds (TTL 5min for live, 30min for pre-match)

  Endpoints:
    GET /api/matches/:id/odds              → all bookmaker odds for match
    GET /api/matches/:id/odds/value-bets   → value bet opportunities
    GET /api/odds/best                     → today's best value bets across all matches

Frontend:
  OddsComparisonComponent       → table of odds across bookmakers
  ValueBetBadgeComponent        → "Value Bet!" indicator on match cards
  OddsMovementChartComponent    → line chart showing odds movement over time
  MatchDetailsPage (enhance)    → add "Odds" tab
```

#### Implementation Plan

**Backend (4 tasks):**
1. Register for The Odds API key, add to env config
2. Create `OddsApiService` — fetch odds for H2H, totals, BTTS markets from multiple bookmakers
3. Create `ValueBetService` — compare ML model probability vs implied probability from odds; flag when model gives >5% edge
4. Create `OddsController` — `GET /api/matches/:id/odds`, `GET /api/matches/:id/odds/value-bets`, `GET /api/odds/best`

**Frontend (3 tasks):**
1. Create `OddsComparisonComponent` — table with bookmaker logos, H2H/totals/BTTS columns
2. Create `ValueBetBadgeComponent` — eye-catching badge on match cards when value bet detected
3. Add "Odds" tab to `MatchDetailsPage` with odds comparison + value bet indicator

#### Acceptance Criteria
- [x] Odds from 3+ bookmakers displayed per match
- [x] Value bets highlighted when ML model gives >5% edge over bookmaker odds
- [x] Odds refresh every 5 minutes for live matches
- [x] Free tier limits respected (500 requests/month on Odds API)

---

## Sprint Calendar

| Sprint | Dates | Focus Areas |
|--------|-------|-------------|
| **1** | Mar 02 - Mar 15 | Phase 8 (Tech Debt) + Phase 9.1-9.3 (Auth, Notifs, Settings) |
| **2** | Mar 16 - Mar 29 | Phase 9.4-9.6 (Search, Comments, Errors) |
| **3** | Mar 30 - Apr 12 | Phase 10.1-10.3 (Badges, Gamification UI, Live Chat) |
| **4** | Apr 13 - Apr 26 | Phase 10.4-10.6 (Lineups, Favorites, Polish) |
| **5** | Apr 27 - May 10 | Phase 11 (Architecture, Testing, Security) |
| **6** | May 11 - May 24 | Phase 12 (NgRx State Management Migration) |
| **7** | May 25 - Jun 07 | **Phase 13.1 (ML Prediction) + 13.3 (Multi-League)** |
| **8** | Jun 08 - Jun 21 | **Phase 13.2 (Fantasy League — Backend)** |
| **9** | Jun 22 - Jul 05 | **Phase 13.2 (Fantasy League — Frontend) + 13.4 (Capacitor)** |
| **10** | Jul 06 - Jul 19 | **Phase 13.5 (Highlights) + 13.6 (Odds) + Beta** |
| **11** | Jul 20 - Aug 02 | Buffer / App Store Submission / v2.0 Release |
