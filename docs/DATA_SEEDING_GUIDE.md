# FootDash Data Seeding Guide

## Overview

FootDash supports multiple data seeding strategies depending on your environment and API access level.

---

## Quick Start (Server Deployment)

```bash
# 1. Run database migrations
cd backend && npm run migrate:run

# 2. Seed users, teams, matches, and all feature data
npx ts-node scripts/seed-full.ts

# 3. (Optional) Seed with real Football API data
FOOTBALL_API_MOCK=false \
FOOTBALL_API_KEY=your-api-key \
npx ts-node scripts/seed-teams.ts
```

---

## Seed Scripts

| Script | Command | What it populates |
|--------|---------|-------------------|
| **seed-full.ts** | `npx ts-node scripts/seed-full.ts` | Everything: users, teams, matches, leagues, standings, fantasy, highlights, odds, gamification, social feed, analytics, notifications |
| **seed-dev.ts** | `npx ts-node scripts/seed-dev.ts` | 5 deterministic users only (admin, test, demo) |
| **seed-teams.ts** | `npx ts-node scripts/seed-teams.ts` | 8 favorite teams + fixtures synced from Football API |
| **seed-social.ts** | `npx ts-node scripts/seed-social.ts` | Social follows and activity feed (requires seed-dev first) |
| **seed-analytics-demo.ts** | `npx ts-node scripts/seed-analytics-demo.ts` | Analytics and prediction demo data |
| **seed-performance-history.ts** | `npx ts-node scripts/seed-performance-history.ts` | Prediction performance history |

---

## Seeded User Accounts

| Email | Password | Role | Pro |
|-------|----------|------|-----|
| `erivanf10@gmail.com` | `Password123!` | ADMIN | Yes |
| `test01@test.com` | `Password123!` | USER | Yes |
| `local+test@example.com` | `Password123!` | USER | No |
| `demo.pro@footdash.com` | `Password123!` | USER | Yes |
| `demo.user@footdash.com` | `Password123!` | USER | No |

---

## Real Data Seeding with Football API

### Can you seed with real/live data? **Yes.**

FootDash integrates with [API-Football (api-sports.io)](https://www.api-football.com/) for real match data, results, lineups, and team stats.

### Setup

1. **Get an API key** at https://www.api-football.com/ (free tier: 100 requests/day)

2. **Configure environment variables:**
   ```bash
   FOOTBALL_API_MOCK=false
   FOOTBALL_API_URL=https://v3.football.api-sports.io
   FOOTBALL_API_KEY=your-api-key-here
   ```

3. **Run the teams seeder** to pull real fixtures:
   ```bash
   cd backend && npx ts-node scripts/seed-teams.ts
   ```
   This seeds 8 major clubs (Man Utd, Liverpool, Man City, Barcelona, Real Madrid, Bayern, PSG, Corinthians) and syncs their **real upcoming and recent fixtures** from the API.

4. **Enable live sync** by setting `FOOTBALL_API_MOCK=false` in the backend `.env`. The app will then:
   - Fetch real match data on demand
   - Sync league standings via scheduled crons
   - Pull real team statistics for analytics

### API Rate Limits (Free Plan)

| Limit | Value |
|-------|-------|
| Requests per day | 100 |
| Requests per minute | 10 |
| Available seasons | 2022–2024 |

The seed script respects rate limits with a 1.5s delay between API calls.

### Additional Real Data Sources

| Source | Env Variable | Data |
|--------|-------------|------|
| **YouTube Data API v3** | `YOUTUBE_API_KEY` | Match highlight videos |
| **The Odds API** | `ODDS_API_KEY` | Live betting odds |
| **ML Service** | `ML_SERVICE_URL` | AI-powered predictions (BTTS, Over/Under) |

When API keys are not set, the backend automatically falls back to mock data.

---

## Recommended Seeding Order for Production

```bash
# Step 1: Migrate database schema
cd backend && npm run migrate:run

# Step 2: Seed core users (required)
npx ts-node scripts/seed-dev.ts

# Step 3: Seed teams with real data (requires API key)
FOOTBALL_API_MOCK=false FOOTBALL_API_KEY=xxx npx ts-node scripts/seed-teams.ts

# Step 4: Seed remaining demo data
npx ts-node scripts/seed-full.ts

# Step 5: Seed social interactions
npx ts-node scripts/seed-social.ts

# Step 6: Seed analytics demo
npx ts-node scripts/seed-analytics-demo.ts
```

---

## Mock Mode (No API Key Needed)

When `FOOTBALL_API_MOCK=true` (default in development), the backend generates synthetic but realistic data for all features. This is ideal for:
- Local development
- CI/CD pipelines
- Demo environments without API costs

Mock data includes realistic team names, scores, schedules, and statistics.
