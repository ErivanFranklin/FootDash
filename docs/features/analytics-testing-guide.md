# Analytics API Testing Guide

## Phase 1 Backend Completion Status

### ✅ Completed Components
1. **Database Schema** - match_predictions and team_analytics tables
2. **Entities** - TypeORM entities with proper relations
3. **Services** - 5 analytics services implemented:
   - FormCalculatorService
   - StatisticalAnalysisService
   - InsightsGeneratorService
   - MatchPredictionService
   - TeamAnalyticsService
4. **Controllers** - REST API endpoints registered
5. **Module Integration** - AnalyticsModule integrated into AppModule
6. **Migration** - Database migration executed successfully
7. **Compilation** - Zero TypeScript errors

### API Endpoints Available

#### Match Predictions
```
GET    /analytics/match/:matchId/prediction  - Get existing prediction
POST   /analytics/match/:matchId/predict     - Generate new prediction
GET    /analytics/upcoming-predictions       - Get predictions for upcoming matches
```

#### Team Analytics
```
GET    /analytics/team/:teamId                - Get team analytics
GET    /analytics/team/:teamId/form           - Get team form data
GET    /analytics/team/compare                - Compare two teams
POST   /analytics/team/refresh-all            - Refresh all analytics
```

### Testing Prerequisites

Before testing, ensure:
1. Backend server is running (`npm run start:dev`)
2. Database contains matches and teams (use seed script or sync from API)
3. You have a valid JWT token for authenticated endpoints

### Manual Testing Steps

#### 1. Get Auth Token
```bash
# Register a test user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!"
  }'

# Login to get token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

#### 2. Check Available Data
```bash
# List teams
curl http://localhost:3000/teams/1

# List matches for a team
curl http://localhost:3000/matches/team/1
```

#### 3. Test Prediction Endpoints
```bash
# Generate prediction for a match
curl -X POST http://localhost:3000/analytics/match/1/predict \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get cached prediction
curl http://localhost:3000/analytics/match/1/prediction \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get upcoming predictions
curl http://localhost:3000/analytics/upcoming-predictions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Test Team Analytics Endpoints
```bash
# Get team analytics
curl http://localhost:3000/analytics/team/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get team form (last 5 matches)
curl http://localhost:3000/analytics/team/1/form \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Compare two teams
curl "http://localhost:3000/analytics/team/compare?homeTeamId=1&awayTeamId=2" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Using Swagger UI

Swagger documentation is available at: http://localhost:3000/api

1. Open browser to http://localhost:3000/api
2. Click "Authorize" button
3. Enter Bearer token: `Bearer YOUR_JWT_TOKEN`
4. Test endpoints directly from Swagger UI

### Expected Response Formats

#### Prediction Response
```json
{
  "matchId": 1,
  "homeTeam": "Team A",
  "awayTeam": "Team B",
  "probabilities": {
    "homeWin": 45.5,
    "draw": 25.0,
    "awayWin": 29.5
  },
  "confidence": "medium",
  "insights": [
    "Team A has won 3 of their last 5 matches",
    "Team B has strong away form",
    "Teams are evenly matched in head-to-head record"
  ],
  "metadata": {
    "homeFormRating": 70.5,
    "awayFormRating": 65.2,
    "headToHeadWins": { "home": 2, "away": 1, "draws": 1 }
  }
}
```

#### Team Analytics Response
```json
{
  "teamId": 1,
  "teamName": "Team A",
  "formRating": 70.5,
  "lastUpdated": "2024-12-10T16:30:00Z",
  "homePerformance": {
    "played": 10,
    "wins": 6,
    "draws": 2,
    "losses": 2
  },
  "awayPerformance": {
    "played": 10,
    "wins": 4,
    "draws": 3,
    "losses": 3
  }
}
```

### Testing Validation

Phase 1 is considered complete when:
- ✅ All endpoints return 2xx status codes for valid requests
- ✅ Predictions are generated with reasonable probabilities (sum = 100%)
- ✅ Insights are meaningful and based on actual data
- ✅ Form ratings are calculated correctly (0-100 scale)
- ✅ Team analytics aggregate match data properly
- ✅ Confidence levels are assigned appropriately
- ✅ Caching works (24hr for predictions, 7 days for analytics)

### Known Limitations

1. **No Machine Learning** - MVP uses statistical model, not ML
2. **Limited Historical Data** - Predictions improve with more matches
3. **No External Factors** - Weather, injuries, etc. not considered
4. **Fixed Algorithm** - Weights are hardcoded (not adaptive)

### Next Steps (Phase 2: Backend Testing)

- Write unit tests for all services
- Write E2E tests for API endpoints
- Test edge cases (no data, incomplete data)
- Performance testing with large datasets
- Test caching behavior

---

**Document Created:** December 10, 2024  
**Status:** Phase 1 Backend Foundation Complete ✅
