# Backend Real-time Match Updates - Implementation Summary

## What Was Implemented

### 1. Live Match Polling Service (`live-match.service.ts`)
- **Purpose**: Polls the Football API every 30 seconds for live match updates
- **Key Features**:
  - Tracks active polling intervals per match using a Map
  - Detects changes in score, status, and minute
  - Broadcasts updates via WebSocket when data changes
  - Automatically stops polling when match finishes
  - Manages last known state to detect changes

### 2. Match Scheduler Service (`match-scheduler.service.ts`)
- **Purpose**: Automatically manages which matches should be polled
- **Key Features**:
  - Runs every 5 minutes using `@Cron` decorator
  - Finds matches that are live or starting soon (within 15 minutes)
  - Automatically starts polling for new live matches
  - Automatically stops polling for finished matches
  - Provides manual trigger endpoints for testing

### 3. Football API Service Updates (`football-api.service.ts`)
- **New Method**: `getMatch(matchId: number)`
  - Fetches single match data by ID
  - Supports mock mode for development
  - Returns normalized match data with scores, status, minute

### 4. Matches Service Updates (`matches.service.ts`)
- **New Method**: `getMatchesByDate(date: string)`
  - Queries database for matches on a specific date
  - Uses TypeORM's `Between` operator for date range
  - Returns matches with team relations

### 5. Module Configuration
- **App Module**: Added `ScheduleModule.forRoot()` for cron support
- **Matches Module**: Added `LiveMatchService` and `MatchSchedulerService` to providers
- **Dependencies**: Installed `@nestjs/schedule` package

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Every 5 Minutes                         │
│                   (Cron Scheduler)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ MatchSchedulerService  │
        │  - Find live matches   │
        │  - Start/stop polling  │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   LiveMatchService     │◄──── Polls every 30s
        │  - Poll Football API   │
        │  - Detect changes      │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │   MatchGateway         │
        │  - Broadcast to rooms  │
        │  - WebSocket emit      │
        └────────┬───────────────┘
                 │
                 ▼
        ┌────────────────────────┐
        │  Connected Clients     │
        │  (Frontend apps)       │
        └────────────────────────┘
```

## Environment Variables

Add these to your `.env` file:

```bash
# Live match polling interval (milliseconds)
LIVE_MATCH_POLL_INTERVAL=30000

# Live match window (minutes from kickoff to consider match "live")
LIVE_MATCH_WINDOW_MINUTES=120
```

## How It Works

### Automatic Operation
1. **On Application Startup**: MatchScheduler runs initial check for live matches
2. **Every 5 Minutes**: Scheduler checks database for matches that are:
   - Currently in live status (IN_PLAY, PAUSED, HALFTIME)
   - Scheduled to start within 15 minutes
   - Started within last 2 hours (configurable)
3. **For Each Live Match**: LiveMatchService:
   - Polls Football API every 30 seconds
   - Compares new data with last known state
   - Broadcasts via WebSocket if changes detected
   - Stops polling when match finishes

### WebSocket Integration
- Uses existing `MatchGateway.broadcastMatchUpdate(matchId, data)`
- Clients subscribe to specific match rooms
- Updates sent only to subscribed clients
- Room-based architecture for efficient broadcasting

## Testing

### Manual Testing Endpoints
The scheduler service provides methods for manual testing:

```typescript
// Force start polling for a specific match
matchSchedulerService.forceStartPolling('123');

// Force stop polling
matchSchedulerService.forceStopPolling('123');

// Manual scheduler check
matchSchedulerService.triggerManualCheck();

// Get current status
matchSchedulerService.getStatus();
```

### Test Scenarios
1. **Mock Mode**: Set `FOOTBALL_API_MOCK=true` to use mock data
2. **Live Match**: Insert a match with status 'IN_PLAY' in database
3. **Score Change**: Mock data returns different scores on each poll
4. **Match Finish**: Status changes to 'FINISHED' stops polling

## Next Steps

### Backend Remaining Tasks
- [ ] Add admin endpoints to manually control polling
- [ ] Add metrics/logging for polling performance
- [ ] Add error retry logic with exponential backoff
- [ ] Add unit tests for LiveMatchService
- [ ] Add unit tests for MatchSchedulerService
- [ ] Add E2E tests for WebSocket broadcasting

### Frontend Implementation
- [ ] Create WebSocketService for connection management
- [ ] Create LiveMatchService for subscribing to matches
- [ ] Add live indicator component (pulsing dot)
- [ ] Update match detail page with live updates
- [ ] Add toast notifications for score changes
- [ ] Add sound notifications (optional)

## Code Quality

### ✅ Completed
- TypeScript compilation passes
- No linting errors
- Proper dependency injection
- Lifecycle hooks implemented (OnModuleInit, OnModuleDestroy)
- Error handling with logging
- Type-safe interfaces

### 📝 To Improve
- Add unit test coverage
- Add JSDoc comments for public methods
- Add integration tests with WebSocket
- Add performance monitoring
- Add rate limiting for API calls

## Files Changed
- `backend/src/matches/live-match.service.ts` (NEW)
- `backend/src/matches/match-scheduler.service.ts` (NEW)
- `backend/src/matches/matches.module.ts` (UPDATED)
- `backend/src/matches/matches.service.ts` (UPDATED - added getMatchesByDate)
- `backend/src/football-api/football-api.service.ts` (UPDATED - added getMatch)
- `backend/src/football-api/football-api-adapter.interface.ts` (UPDATED)
- `backend/src/app.module.ts` (UPDATED - added ScheduleModule)
- `backend/package.json` (UPDATED - added @nestjs/schedule)
