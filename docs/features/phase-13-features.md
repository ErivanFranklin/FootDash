# Phase 13 Features Guide

## Overview

Phase 13 introduced four major feature modules to FootDash:

1. **[Fantasy League](#fantasy-league)** — Create and manage private football fantasy leagues
2. **[Multi-League Support](#multi-league-support)** — Browse and follow multiple football leagues  
3. **[Video Highlights](#video-highlights)** — Watch match highlight clips with view tracking
4. **[Betting Odds](#betting-odds)** — Compare bookmaker odds and find value bets

---

## Fantasy League

### File Locations

| Layer | Path |
|-------|------|
| Backend module | `backend/src/fantasy/` |
| Frontend page | `frontend/src/app/features/fantasy/pages/` |
| Migration | `backend/migrations/1772446820000-CreateFantasyTables.ts` |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/fantasy/leagues` | List leagues the current user belongs to |
| `POST` | `/fantasy/leagues` | Create a new league |
| `POST` | `/fantasy/leagues/join` | Join a league via invite code |
| `GET` | `/fantasy/leagues/:id/standings` | Get league standings |
| `POST` | `/fantasy/leagues/:id/transfer` | Make a player transfer |

### Database Tables

- `fantasy_leagues` — League metadata, invite code, scoring rules
- `fantasy_teams` — Team entries per user per league
- `fantasy_rosters` — Player selections for each team  
- `fantasy_gameweeks` — Gameweek periods with deadlines
- `fantasy_points` — Points scored per team per gameweek

### Key Behaviour

- **Invite codes** are 8-character alphanumeric strings (uppercase, no ambiguous chars)
- **Default max members**: 20
- **Scoring system** uses FPL-style values: goals (6 pts), assists (3 pts), clean sheets (4 pts), etc.
- **Transfer window**: closes at gameweek deadline  
- **League statuses**: `draft → active → completed`

---

## Multi-League Support

### File Locations

| Layer | Path |
|-------|------|
| Backend module | `backend/src/leagues/` |
| Frontend pages | `frontend/src/app/features/leagues/pages/` |
| Migration | `backend/migrations/1772446830000-CreateLeaguesTable.ts` |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/leagues` | List all available leagues |
| `GET` | `/leagues/featured` | Get featured/priority leagues |
| `GET` | `/leagues/:id` | Get league details |
| `GET` | `/leagues/:id/standings` | Get current standings from API |

### Database Schema

```sql
leagues (
  id, external_id UNIQUE, name, country, logo, type,
  is_featured, created_at, updated_at
)
```

### Data Sync

The `LeagueService.syncLeagues()` cron job runs daily to fetch live league data from the Football API. The `seedIfEmpty()` method runs on startup to ensure at least some data is available in development.

---

## Video Highlights

### File Locations

| Layer | Path |
|-------|------|
| Backend module | `backend/src/highlights/` |
| Frontend page | `frontend/src/app/features/highlights/pages/` |
| Migration | `backend/migrations/1772446840000-CreateHighlightsTable.ts` |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/highlights` | List highlights (paginated: `page`, `limit`) |
| `GET` | `/highlights/search?q=` | Full-text search by title/team |
| `GET` | `/highlights/match/:matchId` | Highlights for a specific match |
| `GET` | `/highlights/:id` | Get a single highlight |
| `POST` | `/highlights/:id/view` | Increment view count |

### Rate Limiting

The highlights controller is throttled to **10 requests/minute** per user.

### YouTube Integration

Set `YOUTUBE_API_KEY` to enable live YouTube Data API v3 syncing. Without the key, the service seeds mock highlights on first startup.

---

## Betting Odds

### File Locations

| Layer | Path |
|-------|------|
| Backend module | `backend/src/odds/` |
| Frontend page | `frontend/src/app/features/odds/pages/` |
| Migration | `backend/migrations/1772446850000-CreateOddsTable.ts` |

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/odds` | List upcoming match odds |
| `GET` | `/odds/value-bets?minEdge=5` | Get value bets above edge threshold |
| `GET` | `/odds/match/:matchId` | Get all bookmaker odds for a specific match |

### Rate Limiting

The odds controller is throttled to **20 requests/minute** per user.

### Value Bet Algorithm

For each market (Home Win, Draw, Away Win, Over 2.5, BTTS Yes):

$$\text{edge} = P_{\text{model}} - P_{\text{implied}}$$

where $P_{\text{implied}} = \frac{1}{\text{decimal odds}} \times 100$ and $P_{\text{model}}$ is the fair probability after removing bookmaker margin.

| Edge | Rating |
|------|--------|
| ≥ 15% | 🟢 High |
| ≥ 10% | 🟡 Medium |
| < 10% | ⚪ Low |

### The Odds API Integration

Set `ODDS_API_KEY` to enable live odds sync from [The Odds API](https://the-odds-api.com/). Without the key, the service seeds 5 mock odds entries on first startup.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ML_SERVICE_URL` | In production | `http://localhost:8000` | ML prediction service URL |
| `YOUTUBE_API_KEY` | Optional | _(empty)_ | Enables live YouTube sync |
| `ODDS_API_KEY` | Optional | _(empty)_ | Enables live odds sync |

---

## Testing

### Backend Unit Tests

```bash
cd backend
npx jest --testPathPattern="fantasy-league.service|league.service|highlights.service|odds.service" --no-coverage
```

### ML Integration Tests

```bash
cd ml-services/prediction-model
pytest tests/test_integration.py -v
```

### Frontend Component Tests

```bash
cd frontend
ng test --include="**/features/fantasy/**" --include="**/features/highlights/**" --include="**/features/odds/**" --include="**/features/leagues/**"
```
