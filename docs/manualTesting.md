# FootDash Manual Testing & Issue Resolution Guide

## Overview
This document contains comprehensive manual testing results for the FootDash application. All identified issues need to be resolved with corresponding unit tests and Playwright E2E tests created to prevent regression.

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

#### Required Tests:
- Unit test for chart data loading
- E2E test for page load without errors
- Visual regression test for card alignment

---

### MATCHES Page
**File**: `frontend/src/app/features/matches/pages/matches.page.html`

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

#### Required Tests:
- E2E tests for each filter state
- Unit tests for filter logic
- API integration tests for match data loading

---

## 🟡 MEDIUM PRIORITY ISSUES

### LEADERBOARD Page
**File**: `frontend/src/app/features/leaderboard/pages/leaderboard.page.html`

#### Issues:
1. **Menu Consistency** 🟡
   - Menu should match BADGES page design pattern
   - Ensure consistent navigation styling

2. **UI Enhancement** 🟡
   - Excessive white space on left side
   - Need better use of available screen real estate
   - Follow BADGES page layout as reference

#### Required Tests:
- Visual regression tests for layout consistency

---

### BADGES Page
**File**: `frontend/src/app/features/badges/pages/badges.page.html`

#### Issues:
1. **Tab Section Alignment** 🟡
   - Tab section not aligned with card content below
   - Need consistent margins and positioning

2. **Missing Badge Icons** 🟡
   - Silver, Bronze, and Platinum tier badges missing icons
   - Should have distinct, recognizable icons for each tier

#### Required Tests:
- Visual tests for icon loading
- Layout tests for tab alignment

---

### ACTIVITY FEEDS Page
**File**: `frontend/src/app/features/social/feed/feed.page.html`

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

#### Required Tests:
- Component tests for heart icon states
- E2E tests for feed interaction

---

### MATCH DETAILS Page
**File**: `frontend/src/app/features/matches/pages/match-details.page.html`

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

#### Required Tests:
- Layout tests for tab content alignment
- Data loading tests for chat and lineup information

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

### Performance Tests
- Loading time tests for data-heavy pages
- Memory leak tests for chart components
- Bundle size monitoring

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

