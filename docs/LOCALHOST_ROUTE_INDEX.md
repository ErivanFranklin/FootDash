# FootDash Localhost Route Index

This file provides clickable links for local development.

- Frontend base: http://localhost:4200
- Backend base: http://localhost:3000
- API base prefix: http://localhost:3000/api

## Frontend Routes (Angular/Ionic)

Public or fallback routes:
- [Login](http://localhost:4200/login)
- [Forgot Password](http://localhost:4200/auth/forgot-password)
- [Reset Password](http://localhost:4200/auth/reset-password)
- [Error](http://localhost:4200/error)
- [Not Found](http://localhost:4200/404)

Authenticated routes (`authGuard`):
- [Home](http://localhost:4200/home)
- [Teams](http://localhost:4200/teams)
- [Matches by Team (sample)](http://localhost:4200/matches/1)
- [Match Details (sample)](http://localhost:4200/match/1)
- [Team Analytics (sample)](http://localhost:4200/analytics/team/1)
- [Prediction Analytics](http://localhost:4200/analytics/predictions)
- [Compare](http://localhost:4200/compare)
- [Onboarding](http://localhost:4200/onboarding)
- [Notifications](http://localhost:4200/notifications)
- [Settings](http://localhost:4200/settings)
- [Search](http://localhost:4200/search)
- [Leaderboard](http://localhost:4200/leaderboard)
- [Badges](http://localhost:4200/badges)
- [Export](http://localhost:4200/export)
- [Pro](http://localhost:4200/pro)
- [Payment Success](http://localhost:4200/payments/success)
- [User Profile (sample)](http://localhost:4200/user-profile/1)
- [Feed](http://localhost:4200/feed)
- [Match Discussion (sample)](http://localhost:4200/match-discussion/1)
- [Leagues](http://localhost:4200/leagues)
- [League Standings (sample)](http://localhost:4200/leagues/1/standings)
- [Fantasy](http://localhost:4200/fantasy)
- [Fantasy League (sample)](http://localhost:4200/fantasy/league/1)
- [Fantasy Team (sample)](http://localhost:4200/fantasy/league/1/team/1)
- [Highlights](http://localhost:4200/highlights)
- [Odds](http://localhost:4200/odds)

Extra guard routes:
- [Match Prediction Pro Route (auth + pro)](http://localhost:4200/analytics/match/1)
- [Admin (auth + admin)](http://localhost:4200/admin)

## Backend API Root Controllers

- [Health](http://localhost:3000/api/health)
- [Auth](http://localhost:3000/api/auth)
- [Dashboard](http://localhost:3000/api/dashboard)
- [Gamification](http://localhost:3000/api/gamification)
- [Search](http://localhost:3000/api/search)
- [Leagues](http://localhost:3000/api/leagues)
- [Matches](http://localhost:3000/api/matches)
- [Payments](http://localhost:3000/api/payments)
- [Analytics](http://localhost:3000/api/analytics)
- [Analytics Export](http://localhost:3000/api/analytics/export)
- [Analytics Team](http://localhost:3000/api/analytics/team)
- [Favorites](http://localhost:3000/api/favorites)
- [Fantasy](http://localhost:3000/api/fantasy)
- [Teams](http://localhost:3000/api/teams)
- [Export](http://localhost:3000/api/export)
- [Admin](http://localhost:3000/api/admin)
- [Highlights](http://localhost:3000/api/highlights)
- [Notifications](http://localhost:3000/api/notifications)
- [User Preferences (sample)](http://localhost:3000/api/users/1/preferences)
- [User Profile (sample)](http://localhost:3000/api/users/1/profile)
- [Reactions](http://localhost:3000/api/reactions)
- [Comments](http://localhost:3000/api/comments)
- [Social Reports](http://localhost:3000/api/social/reports)
- [Follow](http://localhost:3000/api/follow)
- [Chat](http://localhost:3000/api/chat)
- [Alerts](http://localhost:3000/api/alerts)
- [Feed](http://localhost:3000/api/feed)
- [Odds](http://localhost:3000/api/odds)

## Notes

- Some API links may return `401 Unauthorized` unless you are authenticated.
- Some sample IDs (like `1`) may return empty or not found based on your local data.
- SPA fallback means direct frontend links usually return app shell (`200`) and route handling happens client-side.
