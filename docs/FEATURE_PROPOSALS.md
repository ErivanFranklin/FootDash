# FootDash — Feature Proposals & Roadmap

> **Deep codebase analysis** performed on the full backend (22 modules) and frontend (30 routes, 18 feature areas).
> Proposals are ordered by impact and grouped by domain.

---

## Table of Contents

1. [Visualization & Charts (High Priority)](#1-visualization--charts)
2. [Admin Dashboard Enhancements](#2-admin-dashboard-enhancements)
3. [User Experience & UI](#3-user-experience--ui)
4. [Security Hardening](#4-security-hardening)
5. [Analytics Deep-Dive Features](#5-analytics-deep-dive-features)
6. [Social & Engagement](#6-social--engagement)
7. [Fantasy Improvements](#7-fantasy-improvements)
8. [Data Infrastructure](#8-data-infrastructure)
9. [Mobile & PWA](#9-mobile--pwa)
10. [Monetization & Pro Tier](#10-monetization--pro-tier)

---

## 1. Visualization & Charts

**chart.js ^4.5.1** is already installed and used in the analytics modules (doughnut, bar, line, radar). These proposals expand visualization across the app.

### 1.1 📊 Admin Analytics Dashboard (Charts)

**Where:** `/admin` page — new "Analytics" tab alongside current user management.

| Chart | Data Source | Type | Description |
|-------|-----------|------|-------------|
| **User Registrations Over Time** | `users.created_at` | Line / Area chart | Daily/weekly/monthly registration trend. Shows growth velocity. |
| **Pro Conversion Funnel** | `users.isPro` over time | Stacked area or donut | Free vs Pro users over time. Conversion rate. |
| **Active Users** | `user_activities.created_at` | Bar chart | DAU / WAU / MAU from the social `UserActivity` entity. |
| **Role Distribution** | `users.role` | Pie / Donut | USER vs MODERATOR vs ADMIN breakdown. |
| **Prediction Accuracy Trends** | `prediction_performance` | Line chart | Statistical vs ML vs Hybrid model accuracy over time (backend already stores this). |
| **Revenue Overview** | Stripe API / `payments.history` | Area chart | MRR, new subscriptions, churns. Stripe data is already available via the Payments module. |
| **Top Engaged Users** | Computed from predictions + comments + reactions | Horizontal bar | Most active community members. |

**Backend changes:**
- New `GET /admin/analytics/registrations?period=30d` — returns `{ date, count }[]`
- New `GET /admin/analytics/active-users?period=30d` — aggregates `UserActivity`
- New `GET /admin/analytics/prediction-accuracy` — reads from `PredictionPerformance` entity (already exists)
- New `GET /admin/analytics/revenue` — calls Stripe list subscriptions API

**Frontend changes:**
- Add tab-based layout to AdminPage: **Users** (current) | **Analytics** (new)
- `AdminChartsComponent` with 4-6 Chart.js canvases in a responsive grid
- Period selector (7d / 30d / 90d / 1y)

**Effort:** Medium (2-3 days) — backend data exists, mostly frontend charting work.

---

### 1.2 📈 Home Dashboard Charts

**Where:** `/home` page — add visual summary cards above the existing matches list.

| Chart | Data | Type |
|-------|------|------|
| **Your Prediction Accuracy** | `GET /gamification/badges` + user predictions | Gauge / Radial | Shows personal accuracy % with color coding |
| **Upcoming Matches Odds Heatmap** | `GET /odds` for favorites | Mini sparklines | Quick odds overview for favorite teams' next matches |
| **Form Indicator** | `GET /analytics/team/:id` for favorites | Mini line sparkline | Last 5 match results as W/D/L colored dots or line |
| **Weekly Activity Ring** | Predictions + Comments this week | Donut ring | Gamification engagement visual |

**Effort:** Low-Medium (1-2 days) — data endpoints already exist.

---

### 1.3 📉 Prediction Analytics Page (New)

**Where:** New route `/analytics/predictions` — aggregates all prediction data into one visual page.

Currently **`GET /analytics/upcoming-predictions`** and **`GET /analytics/predictions/stats`** exist on the backend but are **not consumed** by the frontend.

**UI:**
- **Accuracy Over Time** (line chart) — how well the models are performing across recent matchweeks
- **Confidence Distribution** (histogram) — distribution of prediction confidence levels
- **Model Comparison** (grouped bar) — Statistical vs ML vs Hybrid comparison side-by-side
- **Recent Predictions Table** — scrollable list with result indicators (✓ ✗) and actual vs predicted scores
- **BTTS & Over/Under Stats** — `GET /analytics/match/:id/prediction/btts` and `over-under` endpoints exist but aren't shown anywhere

**Effort:** Medium (2 days) — backend is ready, just frontend visualization.

---

### 1.4 🏟️ Match Analytics Enhancement

**Where:** Existing `/analytics/match/:matchId` page.

**Additions:**
- **Head-to-Head History Chart** — line chart showing scores from last 10 meetings between the two teams (requires new backend endpoint or Football API integration)
- **Goal Timeline** — horizontal timeline showing when goals were scored (minute markers) for a completed match
- **Possession & Shot Maps** — radar chart comparing key stats (if advanced match stats are available from the Football API)
- **BTTS & Over/Under probability bars** — visual probability bars for the already-existing backend endpoints that aren't consumed

**Effort:** Medium (2-3 days).

---

### 1.5 🏆 League Visualizations

**Where:** Existing `/leagues/:id/standings` page — enhance with charts.

- **Points Progression Chart** (line) — track how each team's points accumulate across matchweeks
- **Goals Scored vs Conceded** (scatter plot) — each team plotted by GS vs GC, color-coded by standing position
- **Form Table** — last 5 results shown as colored circles (🟢🔴🟡) alongside the standings table

**Effort:** Low-Medium — standings data is available, needs processing for charting.

---

### 1.6 💰 Odds Visualization

**Where:** Existing `/odds` page.

- **Odds Movement Chart** (line) — show how odds for a match change over time (requires storing historical odds snapshots)
- **Implied Probability Comparison** (stacked bar) — compare bookmaker-stripped probabilities vs model predictions side-by-side
- **Value Bet Heatmap** — visual grid of matches color-coded by edge strength

**Effort:** Medium — needs backend odds history tracking for the movement chart.

---

## 2. Admin Dashboard Enhancements

### 2.1 🔧 System Health Panel

**Where:** New tab in `/admin`.

- **Backend health** — proxy `GET /health` (TypeORM, memory)
- **ML Service Status** — `GET /analytics/ml/health` (already exists, not consumed)
- **Redis Status** — new endpoint `GET /admin/system/redis`
- **Football API Quota** — remaining daily API calls
- **Last Sync Timestamps** — leagues, odds, highlights (from entity `lastSyncAt` fields)
- **WebSocket Active Connections** — from Socket.IO adapter metrics

**Effort:** Medium (1-2 days).

---

### 2.2 📋 Content Moderation Panel

**Where:** New section in `/admin`.

The backend `SocialReportsController` (`/social/reports`) already supports `POST create`, `GET list`, `PATCH resolve`. Currently the reports endpoint does NOT enforce admin role (noted as a gap).

- List pending reports with content preview
- Approve / Reject / Ban actions
- User warning system
- Content removal capability
- Report statistics chart

**Effort:** Medium (2 days). Backend mostly exists.

---

### 2.3 📊 ML Model Management

**Where:** New tab in `/admin`.

- **ML Service Health** display (`GET /analytics/ml/health`)
- **Model Metrics** dashboard (`GET /analytics/ml/metrics`)
- **Training Data Export** UI — the `GET /analytics/export/training-data` and CSV endpoints exist but have zero frontend consumption
- **Prediction Performance** — accuracy by model type over time
- Trigger model retraining (if ML service supports it)

**Effort:** Medium (2 days).

---

### 2.4 📨 Notification Management

**Where:** Admin panel section.

- Send broadcast notifications to all users or filtered segments (role, pro status)
- View notification delivery stats
- Manage notification templates
- Test push notification to single user

**Effort:** Medium-High (3 days).

---

## 3. User Experience & UI

### 3.1 🌙 Improved Theming & Visual Polish

**Current state:** Theme service supports light/dark/auto. Basic Ionic theming.

**Proposals:**
- **Custom color schemes** — let users pick accent colors (team-branded themes)
- **Glassmorphism cards** for stats/prediction displays
- **Animated stat transitions** — numbers count up when entering view
- **Skeleton loading states** — already exist for matches/teams, extend to all pages
- **Pull-to-refresh** with custom animation (football bouncing)

**Effort:** Low (1-2 days each).

---

### 3.2 🧭 Bottom Tab Navigation

**Current state:** Side menu + back buttons.

**Proposal:** Replace/supplement with 5 bottom tabs:
1. **Home** (dashboard)
2. **Matches** (today's fixtures)
3. **Predict** (quick prediction entry)
4. **Social** (feed)
5. **More** (settings, admin, export, etc.)

This is the standard mobile UX pattern for Ionic apps.

**Effort:** Low-Medium (1 day).

---

### 3.3 📱 Onboarding Flow

**Where:** After first registration.

- Step 1: Select favorite teams (with search)
- Step 2: Choose notification preferences
- Step 3: Quick tour of key features
- Step 4: First prediction prompt

**Effort:** Medium (2 days).

---

### 3.4 🔔 Real-Time Toast Notifications

**Current state:** WebSocket events fire but don't always show in-app toasts.

**Proposal:**
- Show toast overlay for: goal scored (with team + minute), match started, comment reply, new follower, badge earned
- Tapping toast navigates to relevant page
- Sound effects for goals (optional setting)

**Effort:** Low (1 day) — WebSocket infrastructure exists.

---

### 3.5 📊 User Stats Profile Page

**Where:** Enhance `/user-profile/:id`.

- **Prediction Accuracy Ring** — personal accuracy donut chart
- **Activity Heatmap** — GitHub-style contribution calendar showing daily activity
- **Badges Showcase** — visual grid of earned badges (already partially exists)
- **Prediction History Timeline** — line chart of points earned over time
- **Favorite Teams Grid** with team logos

**Effort:** Medium (2 days).

---

## 4. Security Hardening

### 4.1 🔐 Two-Factor Authentication (2FA)

**Proposal:**
- TOTP-based 2FA (Google Authenticator / Authy)
- Backend: new `POST /auth/2fa/setup` (returns QR + secret), `POST /auth/2fa/verify`, `POST /auth/2fa/enable`
- Frontend: Setup wizard with QR code display, code verification modal on login
- Recovery codes for account recovery

**Effort:** High (3-4 days).

---

### 4.2 🛡️ Rate Limiting Enhancements

**Current state:** Global rate limit (100 req / 60s via `@nestjs/throttler`).

**Proposals:**
- **Per-endpoint limits** — stricter for auth (5 login attempts / 15min), looser for reads
- **IP-based blocking** after repeated auth failures
- **Admin ban/unban** IP addresses
- **API usage analytics** — track which endpoints are hit the most (feed into admin dashboard)

**Effort:** Low-Medium (1-2 days).

---

### 4.3 🔑 Session Management

**Proposals:**
- **Active Sessions List** — show user all their active sessions (devices) in Settings
- **Remote Session Revocation** — terminate sessions from other devices
- **Login Audit Log** — IP, device, timestamp of each login (viewable by user and admin)
- **Suspicious Login Alerts** — notify when login from a new location/device

**Backend:** New `LoginAudit` entity + `GET /auth/sessions`, `DELETE /auth/sessions/:id`

**Effort:** Medium (2-3 days).

---

### 4.4 🏗️ Content Security

**Proposals:**
- **CSRF tokens** for state-changing operations (currently only HttpOnly cookies)
- **Input sanitization** middleware (XSS prevention on comments, chat messages, bios)
- **File upload validation** hardening — current avatar uploads accept images but should verify content type + scan

**Effort:** Low-Medium (1-2 days).

---

## 5. Analytics Deep-Dive Features

### 5.1 🤖 AI Insights Feed

**Where:** New page `/insights` or section on `/home`.

- **Natural language insights** generated from analytics data: "Arsenal's home form has improved 15% over the last 5 matches"
- **Key stat highlights** surfaced automatically before big matches
- **Pattern detection** — streaks, trends, anomalies
- Backend generates text from existing `TeamAnalytics` data

**Effort:** Medium-High (3 days).

---

### 5.2 📊 Compare Teams Tool

**Where:** New page `/compare` or enhancement to existing `/analytics/team`.

- Side-by-side team comparison with radar chart
- **Backend already has** `GET /analytics/team/compare` endpoint — but no frontend consumes it
- Stats overlay: form, attack, defense, home/away
- Head-to-head record

**Effort:** Low (1 day) — backend endpoint exists.

---

### 5.3 🎯 Prediction Streak Tracker

**Where:** Gamification enhancement.

- Visual streak counter with fire emoji animation
- Current streak, best streak, average accuracy
- Streak-based badges (already defined in backend: `predictions_streak` criteria type)
- Weekly challenges: "Predict 5 matches correctly this week"

**Effort:** Low-Medium (1-2 days).

---

## 6. Social & Engagement

### 6.1 💬 Enhanced Match-Day Experience

**Proposals:**
- **Live match timeline** — real-time event log (goals, cards, subs) in the match detail tab
- **Live poll** — "Who will score next?" quick polls during matches
- **Emoji reactions** on live events (goal → 🎉, red card → 😮)
- **Match commentary thread** — structured comments pinned to match events

**Effort:** Medium (2-3 days).

---

### 6.2 🏅 Social Leaderboard Enhancements

**Proposals:**
- **Friends Leaderboard** — compare only among people you follow
- **League-specific Leaderboards** — predictions accuracy per league
- **Seasonal Trophies** — end-of-month awards with visual badges
- **Share Leaderboard Position** — social sharing card with rank + points

**Effort:** Medium (2-3 days).

---

### 6.3 📰 News Feed Integration

**Where:** New tab on Home or new route `/news`.

- Aggregate football news from RSS feeds or APIs
- Filtered by user's favorite leagues/teams
- Comment and react on news stories
- Share articles

**Effort:** Medium-High (3 days).

---

## 7. Fantasy Improvements

### 7.1 🛒 Transfer Market Page

**Current gap:** The Fantasy Team page has a "Transfer Market" button that links to a route that **doesn't exist** in `app.routes.ts`.

**Proposal:**
- New route `/fantasy/league/:id/transfers`
- Player search with position/price filters
- Player comparison tool
- Budget calculator
- Transfer confirmation flow

**Effort:** Medium (2-3 days).

---

### 7.2 👤 Player Database

**Current gap:** No `Player` entity exists. Fantasy rosters display `P#123` instead of player names.

**Proposal:**
- New `Player` entity: `id`, `externalId`, `name`, `position`, `teamId`, `photo`, `nationality`, `age`
- Sync from Football API
- Player detail page with stats, form chart, ownership %
- Player search across all teams

**Effort:** High (3-4 days).

---

### 7.3 📊 Fantasy Analytics

- **Points Breakdown Chart** — bar chart showing how points were distributed across gameweeks
- **Captain Pick Analysis** — how often your captain scored well
- **Formation Heatmap** — which formations score highest across all teams
- **Mini-league trends** — line chart showing your rank progression

**Effort:** Medium (2 days).

---

## 8. Data Infrastructure

### 8.1 🔗 Odds ↔ Match Linkage

**Current gap:** `Odds.matchId` is `0` after sync — no mapping to internal `Match` records.

**Fix:** During odds sync, fuzzy-match `homeTeam`/`awayTeam`/`matchDate` against `Match` entity to link them. This enables:
- Show odds directly on match detail pages
- Cross-reference predictions with odds for value detection

**Effort:** Low-Medium (1 day).

---

### 8.2 🎬 Highlights ↔ Match Linkage

**Same gap as odds.** Fix by matching video title keywords against team names + match dates.

**Effort:** Low (0.5 day).

---

### 8.3 📈 Historical Data Collection

- Store odds snapshots over time (for odds movement charts)
- Store prediction accuracy per matchweek (for trend analysis)
- Store team form history (currently only latest analytics snapshot)

**Effort:** Medium (2 days).

---

## 9. Mobile & PWA

### 9.1 📲 Push Notification Enhancements

**Current state:** FCM configured, token registration exists.

**Proposals:**
- **Match Reminder** — send push 15 min before kickoff for favorited matches
- **Goal Alert** — instant push when a favorite team scores
- **Prediction Deadline** — remind to submit predictions before kickoff
- **Badge Earned** — push notification on new badge
- **Leaderboard Movement** — "You moved up to #5 this week!"

**Effort:** Medium (2 days).

---

### 9.2 📵 Offline Enhancements

**Current state:** `OfflineQueueService` + `OfflineStore` queue predictions when offline.

**Proposals:**
- **Cache favorite team data** — last matches, standings, analytics viewable offline
- **Offline match schedule** — cache upcoming fixtures
- **Background sync** — even when app is closed (service worker)

**Effort:** Medium (2-3 days).

---

### 9.3 📱 Capacitor Native Features

**Current state:** Capacitor configured (`capacitor.config.ts` exists).

**Proposals:**
- **Haptic feedback** on goal events and badge unlocks
- **Share to Instagram Stories** — match prediction cards as images
- **Widget** — show next match countdown on home screen (iOS/Android)
- **Biometric authentication** — Face ID / fingerprint for app unlock

**Effort:** Medium-High (varies per feature).

---

## 10. Monetization & Pro Tier

### 10.1 💳 Payment History Page

**Current gap:** Backend `GET /payments/history` exists and `BillingStore` has the method, but **no UI renders it**.

**Proposal:**
- New section in Settings → Subscription tab
- Invoice list with date, amount, status
- Download invoice link
- Cancel/resume subscription button

**Effort:** Low (0.5-1 day) — backend ready.

---

### 10.2 🎁 Pro Feature Gating Strategy

**Current Pro features:** Match predictions view.

**Proposal for expanded Pro:**
| Feature | Free | Pro |
|---------|------|-----|
| Match predictions | Basic (1X2 only) | Full (BTTS, O/U, confidence) |
| Team analytics | Last 3 matches | Full history + comparisons |
| Charts & visualizations | Basic sparklines | Full interactive charts |
| Fantasy leagues | 1 league max | Unlimited |
| Export data | — | CSV + JSON |
| Odds & Value Bets | View only | Value bet alerts + push |
| Ad-free | ✗ | ✓ |
| Custom themes | ✗ | ✓ |
| Priority ML predictions | ✗ | ✓ |

**Effort:** Medium (2-3 days) — mostly guard logic adjustments.

---

## Priority Matrix

| Priority | Feature | Impact | Effort | Dependencies |
|----------|---------|--------|--------|--------------|
| 🔴 **P0** | Admin Analytics Dashboard (1.1) | Very High | Medium | None — data exists |
| 🔴 **P0** | Home Dashboard Charts (1.2) | Very High | Low-Med | None — data exists |
| 🔴 **P0** | Prediction Analytics Page (1.3) | High | Medium | None — endpoints exist |
| 🟡 **P1** | Team Compare Tool (5.2) | High | Low | Backend endpoint exists |
| 🟡 **P1** | Bottom Tab Navigation (3.2) | High | Low | None |
| 🟡 **P1** | Content Moderation Panel (2.2) | High | Medium | Backend mostly exists |
| 🟡 **P1** | Payment History Page (10.1) | Medium | Low | Backend exists |
| 🟡 **P1** | Odds ↔ Match Linkage (8.1) | High | Low-Med | Backend fix only |
| 🟢 **P2** | Match Analytics Enhancement (1.4) | High | Medium | Some new endpoints |
| 🟢 **P2** | League Visualizations (1.5) | Medium | Low-Med | Data processing |
| 🟢 **P2** | System Health Panel (2.1) | Medium | Medium | New endpoints |
| 🟢 **P2** | Push Notification Enhancements (9.1) | High | Medium | FCM already configured |
| 🟢 **P2** | Fantasy Transfer Market (7.1) | High | Medium | Route gap fix |
| 🔵 **P3** | 2FA (4.1) | Medium | High | Full implementation |
| 🔵 **P3** | Player Database (7.2) | High | High | New entity + sync |
| 🔵 **P3** | AI Insights Feed (5.1) | Medium | High | NLP/processing |
| 🔵 **P3** | Onboarding Flow (3.3) | Medium | Medium | UI-only |
| 🔵 **P3** | News Feed Integration (6.3) | Medium | Med-High | External APIs |

---

## Suggested Implementation Order

### Phase 1 — Visual Impact (1-2 weeks)
1. ✅ Admin Analytics Dashboard with charts
2. ✅ Home Dashboard sparklines/rings
3. ✅ Prediction Analytics page (consume existing endpoints)
4. ✅ Team Compare page (backend already done)
5. ✅ Bottom Tab Navigation

### Phase 2 — Data Quality & Admin (1-2 weeks)
6. Fix Odds ↔ Match linkage
7. Fix Highlights ↔ Match linkage
8. Content Moderation panel in admin
9. Payment History page
10. System Health panel

### Phase 3 — Engagement & Social (2 weeks)
11. Enhanced Match-Day Experience
12. Push Notification enhancements
13. Real-time toasts for goals/events
14. User Profile stats page with charts
15. Social Leaderboard enhancements

### Phase 4 — Pro & Monetization (1-2 weeks)
Status: Started (2026-03-06)

16. Expanded Pro feature gating
17. Fantasy Transfer Market
18. Player Database entity
19. Fantasy Analytics charts

Kickoff progress:
- [x] Expanded Pro gating applied to advanced analytics routes
- [x] Fantasy Transfer Market backend + UI foundation
- [ ] Player Database entity + migration
- [ ] Fantasy analytics charts integration

### Phase 5 — Security & Polish (1 week)
20. 2FA
21. Session management
22. Rate limiting per-endpoint
23. Onboarding flow
24. Offline enhancements

---

*Generated from full codebase analysis — 22 backend modules, 30 frontend routes, 18 feature areas examined.*
