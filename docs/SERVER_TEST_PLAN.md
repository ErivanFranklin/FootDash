# FootDash Server Test Plan

> End-to-end manual verification after deployment.  
> Run through each section in order — later sections depend on earlier ones.

---

## Prerequisites

| Item | Check |
|------|-------|
| Backend API responds at `/api/health` | ☐ |
| Frontend loads at root URL | ☐ |
| Database migrations ran (`npm run migrate:run`) | ☐ |
| Seed data loaded (`npx ts-node scripts/seed-full.ts`) | ☐ |
| Redis is reachable (WebSocket / caching) | ☐ |

---

## 1. Authentication

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 1.1 | Open the app root URL | Login page loads | ☐ |
| 1.2 | Register a new account (email + password) | Success → redirected to Home | ☐ |
| 1.3 | Logout (side menu → Logout) | Redirected to Login page | ☐ |
| 1.4 | Login with newly created credentials | Success → Home page with "Connection: connected" banner | ☐ |
| 1.5 | Login with seeded admin: `erivanf10@gmail.com` / `Password123!` | Success → Home page | ☐ |
| 1.6 | Login with seeded demo: `demo.user@footdash.com` / `Password123!` | Success → Home page | ☐ |
| 1.7 | Try login with wrong password | Error message displayed, no crash | ☐ |
| 1.8 | Refresh page while logged in | Session restored (no re-login needed) | ☐ |

---

## 2. Home Page

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 2.1 | Verify Home page loads after login | Page header, content, WebSocket status visible | ☐ |
| 2.2 | Check side menu (desktop) or bottom tab bar (mobile) | All nav items present: Home, Teams, Feed, Profile, Notifications, Predictions, Team Compare, Settings | ☐ |

---

## 3. Teams

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 3.1 | Navigate to Teams via menu | Teams list page loads (not stuck on previous page) | ☐ |
| 3.2 | Verify team cards display | Cards with team name, logo, league info | ☐ |
| 3.3 | Use search bar to filter teams | List filters in real-time | ☐ |
| 3.4 | Switch between All / Favorites tabs | Tab content changes correctly | ☐ |
| 3.5 | Tap a team's "View Matches" button | Navigates to that team's match list | ☐ |
| 3.6 | Add a team to favorites (heart icon) | Icon fills / color changes, team appears in Favorites tab | ☐ |
| 3.7 | Remove a team from favorites | Icon reverts, team removed from Favorites tab | ☐ |
| 3.8 | Tap "Sync" / refresh action | Teams reload from API | ☐ |

---

## 4. Matches

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 4.1 | From a team's match list, tap a match | Match Details page loads with score, teams, kickoff info | ☐ |
| 4.2 | Check Info tab | Venue, referee, competition displayed | ☐ |
| 4.3 | Check Lineups tab | Starting XI and substitutes displayed for both teams | ☐ |
| 4.4 | Use back button | Returns to previous page cleanly (no stuck page) | ☐ |

---

## 5. Analytics & Predictions

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 5.1 | Navigate to Predictions | Prediction page loads | ☐ |
| 5.2 | Open a match prediction page | Prediction cards load (BTTS, Over/Under probabilities displayed) | ☐ |
| 5.3 | Verify BTTS probabilities show percentages (not 0/0) | Values between 1-99%, confidence indicator shown | ☐ |
| 5.4 | Verify Over/Under probabilities show percentages | Values between 1-99%, line shows 2.5 | ☐ |
| 5.5 | If ML service is down: verify fallback data loads | Probabilities still display (statistical fallback, "low" confidence) | ☐ |
| 5.6 | Navigate to Team Compare | Comparison page loads | ☐ |
| 5.7 | Select two teams for comparison | Radar chart, form/win%/defensive ratings render | ☐ |
| 5.8 | Verify no `.toFixed()` crashes | No blank screen or console errors | ☐ |

---

## 6. Analytics Charts (Team Analytics)

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 6.1 | Open a team's analytics card | Charts (doughnut, bar, line, radar) render | ☐ |
| 6.2 | Toggle dark mode (Settings) | Charts re-render with appropriate colors | ☐ |
| 6.3 | Toggle light mode | Charts show dark text on light background, no invisible elements | ☐ |

---

## 7. Feed (Social)

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 7.1 | Navigate to Feed | Feed page loads | ☐ |
| 7.2 | Post a message (if feature enabled) | Message appears in feed | ☐ |
| 7.3 | Scroll feed | Infinite scroll loads more items | ☐ |

---

## 8. Profile

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 8.1 | Navigate to Profile | Profile page loads with user info | ☐ |
| 8.2 | Edit profile fields (if editable) | Changes save successfully | ☐ |

---

## 9. Notifications

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 9.1 | Navigate to Notifications | Notifications page loads | ☐ |
| 9.2 | Check for any seeded notifications | List displays or empty state shown | ☐ |

---

## 10. Settings

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 10.1 | Navigate to Settings | Settings page loads | ☐ |
| 10.2 | Change language to Portuguese | UI text changes to Portuguese | ☐ |
| 10.3 | Change language to Spanish | UI text changes to Spanish | ☐ |
| 10.4 | Change back to English | UI text changes to English | ☐ |
| 10.5 | Toggle dark/light mode | Theme changes across all pages | ☐ |

---

## 11. Navigation Regression Checks

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 11.1 | From Match Details, tap Teams in menu | Teams page loads (not stuck on match details) | ☐ |
| 11.2 | Rapidly navigate between Home → Teams → Predictions → Feed | All pages load without freezing | ☐ |
| 11.3 | Deep link: paste `/teams` URL directly | Teams page loads after auth redirect | ☐ |
| 11.4 | Deep link: paste `/analytics/match/6281` directly | Match prediction page loads | ☐ |
| 11.5 | Use browser back/forward buttons | Navigation history works correctly | ☐ |

---

## 12. Responsive Layout

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 12.1 | Desktop (>992px) | Side menu visible, tab bar hidden | ☐ |
| 12.2 | Tablet (768-992px) | Side menu collapsible, tab bar visible | ☐ |
| 12.3 | Mobile (<768px) | Side menu hidden, bottom tab bar visible | ☐ |

---

## 13. Error Handling

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 13.1 | Navigate to non-existent route `/xyz` | 404 page or redirect to home | ☐ |
| 13.2 | Open console → check for repeating errors | No infinite error loops or 503 spam | ☐ |
| 13.3 | Disconnect network briefly → reconnect | App recovers, WebSocket reconnects | ☐ |

---

## 14. Logout

| # | Step | Expected Result | ✓ |
|---|------|-----------------|---|
| 14.1 | Tap Logout in side menu | Redirected to Login page | ☐ |
| 14.2 | Try accessing `/teams` after logout | Redirected to Login (auth guard) | ☐ |
| 14.3 | Refresh after logout | Login page stays (no auto-restore) | ☐ |

---

## Post-Test Summary

| Area | Pass | Fail | Notes |
|------|------|------|-------|
| Authentication | /8 | | |
| Home | /2 | | |
| Teams | /8 | | |
| Matches | /4 | | |
| Analytics | /8 | | |
| Charts | /3 | | |
| Feed | /3 | | |
| Profile | /2 | | |
| Notifications | /2 | | |
| Settings | /5 | | |
| Navigation | /5 | | |
| Responsive | /3 | | |
| Error Handling | /3 | | |
| Logout | /3 | | |
| **TOTAL** | **/59** | | |
