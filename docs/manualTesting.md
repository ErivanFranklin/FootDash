# FootDash Manual Testing & Issue Resolution Guide

## Overview
This document contains comprehensive manual testing results for the FootDash application. All identified issues need to be resolved with corresponding unit tests and Playwright E2E tests created to prevent regression.

## Current Implementation Status (March 8, 2026)
- Completed: Core UI fixes, spacing alignment updates, prediction stats fallback, chat sample fallback data, and new unit/E2E test coverage additions.
- Completed: Full Playwright suite execution started and completed (161 tests executed).
- In Progress: Triage and stabilization of failing/fragile E2E cases.
- Pending: Visual regression baseline workflow and final checklist sign-off after E2E stabilization.

## Priority Levels
- 🔴 **HIGH**: Critical functionality/UI issues affecting user experience
- 🟡 **MEDIUM**: UI/UX improvements and data display issues
- 🟢 **LOW**: Minor enhancements and optimizations

## General Requirements
- **Consistent Margins**: Ensure 16px consistent margins across all pages
- **Purple Lines**: Consider purple accent lines as alignment guides requiring fixes
- **Responsive Design**: All fixes must work on mobile and desktop
- **Loading States**: Proper loading indicators for all async operations
- **Error Handling**: Graceful error states with user-friendly messages

---

## 🔴 HIGH PRIORITY ISSUES

### HOME Page
**File**: `frontend/src/app/features/dashboard/pages/home.page.html`
**Reference Image**: `docs/image.png`

#### Issues:
1. **Card Alignment** 🔴
   - Top dashboard cards (Rank, Predictions, Badges, Favorites) are not aligned with bottom cards (Upcoming Matches)
   - Expected: All cards should have consistent left/right margins and spacing
   - Current: Top cards appear misaligned with bottom section

2. **Predictions Chart Data** 🔴
   - Chart shows "—" instead of actual prediction accuracy
   - Need to populate real prediction data from backend API
   - Chart should display user's prediction accuracy percentage

3. **Loading Errors** 🔴
   - **Translation Error**: `SETTINGS.LANGUAGE` translation key missing
     - Location: Likely in settings/language selector component
     - Fix: Add translation key to i18n files
   - **URL Construction Error**: `TypeError: Failed to construct 'URL': Invalid base URL`
     - Location: `getAssetPath` and icon loading functions
     - Root cause: Invalid base URL configuration in environment
     - Fix: Verify `environment.apiBaseUrl` and asset path configurations

#### Required Improvements Checklist:
- [x] Top metric cards align horizontally with lower match cards
- [x] Predictions card shows real values (not `—`) when data exists
- [x] No `SETTINGS.LANGUAGE` missing translation in console
- [x] No `Invalid base URL` icon/asset error in console

#### Required Tests:
- Unit test for chart data loading
- E2E test for page load without errors
- Visual regression test for card alignment

#### Acceptance Criteria:
- Dashboard renders without console errors
- Card gutters are visually consistent in desktop and mobile

---

### MATCHES Page
**File**: `frontend/src/app/features/matches/pages/matches.page.html`
**Reference Image**: `docs/image-4.png`

#### Issues:
1. **Filter Data Population** 🔴
   - All filter tabs (Today, Live, Upcoming) show no data
   - API endpoints return empty results
   - Need to seed match data or fix API queries

2. **Filter Logic Verification** 🔴
   - **Today Filter**: `?season=2024&range=all&limit=10&from=2026-03-07&to=2026-03-07`
     - Should show matches for current date only
   - **Live Filter**: `?season=2024&range=recent&limit=10&from=2026-03-07&to=2026-03-07`
     - Should show currently live matches
   - **Upcoming Filter**: `?season=2024&range=upcoming&limit=10&from=2026-03-07`
     - Should show future matches
   - **Unselected State**: When no filters selected, should show default match list

3. **Match Filters Form Enhancement** 🟡
   - Form needs better UX design
   - Add proper form validation
   - Improve filter application logic

4. **Blue Button Functionality** 🟡
   - Button needs appropriate icon
   - Ensure click handler works correctly
   - Clarify button's purpose and expected behavior

#### Required Improvements Checklist:
- [x] Today/Live/Upcoming chips return expected filtered data
- [x] Unselecting all chips restores default list behavior
- [x] Match Filters form has clear apply action and better UX
- [x] Floating action button uses proper icon and triggers reload

#### Required Tests:
- E2E tests for each filter state
- Unit tests for filter logic
- API integration tests for match data loading

#### Acceptance Criteria:
- Filter behavior matches query expectations
- At least one visible fixture state is rendered (real or fallback in dev)

---

## 🟡 MEDIUM PRIORITY ISSUES

### LEADERBOARD Page
**File**: `frontend/src/app/features/gamification/pages/leaderboard/leaderboard.page.html`
**Reference Image**: `docs/image-1.png`

#### Issues:
1. **Menu Consistency** 🟡
   - Menu should match BADGES page design pattern
   - Ensure consistent navigation styling

2. **UI Enhancement** 🟡
   - Excessive white space on left side
   - Need better use of available screen real estate
   - Follow BADGES page layout as reference

#### Required Improvements Checklist:
- [x] Segment/filter area aligned with content cards
- [x] Leaderboard rows use consistent spacing and margins
- [x] Left-side whitespace reduced for better content balance

#### Required Tests:
- Visual regression tests for layout consistency

#### Acceptance Criteria:
- Leaderboard looks visually consistent with Badges page structure

---

### BADGES Page
**File**: `frontend/src/app/features/gamification/pages/badges/badges.page.html`
**Reference Image**: `docs/image-2.png`

#### Issues:
1. **Tab Section Alignment** 🟡
   - Tab section not aligned with card content below
   - Need consistent margins and positioning

2. **Missing Badge Icons** 🟡
   - Silver, Bronze, and Platinum tier badges missing icons
   - Should have distinct, recognizable icons for each tier

#### Required Improvements Checklist:
- [x] Segment tabs align with cards/grid content
- [x] Bronze/Silver/Platinum fallback icons always render
- [x] Badge tier styling remains visually distinct

#### Required Tests:
- Visual tests for icon loading
- Layout tests for tab alignment

#### Acceptance Criteria:
- No missing icon placeholders for known badge tiers

---

### ACTIVITY FEEDS Page
**File**: `frontend/src/app/features/social/feed/feed.page.html`
**Reference Image**: `docs/image-3.png`

#### Issues:
1. **Menu Consistency** 🟡
   - Menu should match BADGES page design pattern

2. **Heart Icon Logic** 🟡
   - Clarify purpose of heart icons on feed items
   - Currently shows filled heart for reactions, outline for others
   - Ensure consistent behavior across all activity types

3. **Duplicate Heart Removal** 🟡
   - Remove any duplicate heart icons
   - Keep single heart per card with appropriate state

#### Required Improvements Checklist:
- [x] Feed header style is consistent with app page headers
- [x] Exactly one heart action icon per card
- [x] Non-reaction cards show outline heart; reaction cards show filled heart
- [x] Hover states (desktop) provide clear interaction feedback

#### Required Tests:
- Component tests for heart icon states
- E2E tests for feed interaction

#### Acceptance Criteria:
- No duplicate heart icon appears in any activity card state

---

### MATCH DETAILS Page
**File**: `frontend/src/app/features/matches/pages/match-details.page.html`
**Reference Image (Info)**: `docs/image-5.png`
**Reference Image (Lineup)**: `docs/image-6.png`

#### Issues:
1. **Info Tab Alignment** 🟡
   - Menu texts and cards below need proper alignment
   - Ensure consistent spacing with page cards

2. **Live Chat Data** 🟢
   - Add sample chat messages for better visualization
   - Test real-time chat functionality

3. **Lineup Tab Alignment** 🟡
   - Cards text and buttons need alignment
   - Ensure consistent button positioning

4. **Lineup Data Enhancement** 🟢
   - Add comprehensive lineup data
   - Improve player position visualization
   - Add formation display

#### Required Improvements Checklist:
- [x] Info tab spacing aligned with page card grid
- [x] Lineups tab card/text/button alignment fixed
- [x] Fallback/sample lineup data renders when API data is empty (dev)
- [x] Live chat area shows meaningful sample or current messages

#### Required Tests:
- Layout tests for tab content alignment
- Data loading tests for chat and lineup information

#### Acceptance Criteria:
- Info and Lineups tabs are visually aligned and readable on mobile/desktop

---

## Testing Requirements

### Unit Tests
- Create unit tests for all new components and services
- Test data transformation and API calls
- Validate form validation logic
- Test error handling scenarios

### E2E Tests (Playwright)
- Page load tests for all mentioned pages
- Filter functionality tests
- Navigation and menu interaction tests
- Visual regression tests for layout fixes
- Error state handling tests

Status:
- Added/updated: page-level coverage for dashboard, matches, feed, gamification, and match discussion/detail paths.
- Full run baseline (March 8, 2026): `139 passed`, `9 skipped`, `13 failed`.
- Stabilization rerun (targeted failed suites except analytics): `27 passed`, `6 failed`.
- Current remaining failures are isolated to `tests/15-analytics.spec.ts`:
   - Backend/API error: `/api/analytics/match/:id/prediction` returns `500`
   - Route access expectations for analytics/pro flows do not match current environment behavior

### Performance Tests
- Loading time tests for data-heavy pages
- Memory leak tests for chart components
- Bundle size monitoring

Status:
- Bundle/build validation: completed (`ng build --configuration=development` passed).
- Loading/memory benchmarks: pending explicit benchmark run.

API validation update (March 8, 2026):
- `tests/21-api-health.spec.ts` result: `25 passed`, `5 skipped`.
- Skipped authenticated endpoints in current env:
   - `/api/highlights`
   - `/api/highlights/search?q=goal`
   - `/api/fantasy/leagues`
   - `/api/odds`
   - `/api/odds/value-bets`

## Implementation Order
1. Fix critical loading errors (URL construction, translations)
2. Resolve data population issues (matches, predictions)
3. Address alignment and spacing issues
4. Enhance UI components and icons
5. Add comprehensive test coverage

## Success Criteria
- All pages load without console errors
- Data displays correctly in all components
- UI is consistent and responsive
- All manual test cases pass
- Comprehensive test suite covers all functionality

## Open Validation Items
- [x] Run full Playwright suite and capture final status
- [x] Validate API-backed real data states for HOME predictions and MATCHES filters (non-fallback)
- [ ] Execute visual regression baseline process for layout-sensitive pages
- [ ] Stabilize remaining analytics E2E/backend failures and rerun full Playwright until green
- [ ] Final QA sign-off pass across mobile and desktop viewports

## Quick Visual Map
- HOME: `docs/image.png`
- LEADERBOARD: `docs/image-1.png`
- BADGES: `docs/image-2.png`
- ACTIVITY FEED: `docs/image-3.png`
- MATCHES: `docs/image-4.png`
- MATCH DETAILS (Info): `docs/image-5.png`
- MATCH DETAILS (Lineup): `docs/image-6.png`

