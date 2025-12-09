# Real-time Match Updates - Implementation Strategy

## Overview
Enable live match score and event updates without page refresh using WebSocket technology.

---

## Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌──────────────────┐
│  Football API   │◄────────│  Match Poller   │────────►│  Match Gateway   │
│ (football-data) │  Poll   │   (NestJS)      │ Emit    │   (WebSocket)    │
└─────────────────┘  30-60s └─────────────────┘ Events  └──────────────────┘
                                                                 │
                                                                 │ WS
                                                                 ▼
                                                          ┌──────────────────┐
                                                          │  Frontend Clients│
                                                          │  (Angular/Ionic) │
                                                          └──────────────────┘
```

---

## Implementation Phases

### Phase 1: Backend WebSocket Infrastructure (Days 1-2)

**1.1 Install Dependencies**
```bash
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
npm install --save-dev @types/socket.io
```

**1.2 Create WebSocket Module**
```typescript
// backend/src/websockets/websockets.module.ts
@Module({
  providers: [MatchGateway],
  exports: [MatchGateway]
})
export class WebSocketsModule {}
```

**1.3 Implement Match Gateway**
```typescript
// backend/src/websockets/match.gateway.ts
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || '*' },
  namespace: '/matches'
})
export class MatchGateway {
  @WebSocketServer()
  server: Server;

  // Handle client connections
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Subscribe to specific match
  @SubscribeMessage('subscribe-match')
  handleSubscribeMatch(client: Socket, matchId: string) {
    client.join(`match-${matchId}`);
    return { success: true, matchId };
  }

  // Unsubscribe from match
  @SubscribeMessage('unsubscribe-match')
  handleUnsubscribeMatch(client: Socket, matchId: string) {
    client.leave(`match-${matchId}`);
    return { success: true };
  }

  // Emit match update to all subscribers
  emitMatchUpdate(matchId: string, update: any) {
    this.server.to(`match-${matchId}`).emit('match-update', update);
  }
}
```

---

### Phase 2: Live Match Polling Service (Days 2-3)

**2.1 Create Live Match Service**
```typescript
// backend/src/matches/live-match.service.ts
@Injectable()
export class LiveMatchService {
  private pollingIntervals = new Map<string, NodeJS.Timeout>();

  constructor(
    private footballApiService: FootballApiService,
    private matchGateway: MatchGateway
  ) {}

  async startPolling(matchId: string) {
    if (this.pollingIntervals.has(matchId)) return;

    // Poll every 30 seconds
    const interval = setInterval(async () => {
      try {
        const liveData = await this.footballApiService.getMatch(matchId);
        
        // Check if match is still live
        if (liveData.status === 'FINISHED' || liveData.status === 'POSTPONED') {
          this.stopPolling(matchId);
          return;
        }

        // Emit update via WebSocket
        this.matchGateway.emitMatchUpdate(matchId, {
          matchId,
          score: liveData.score,
          status: liveData.status,
          minute: liveData.minute,
          timestamp: new Date()
        });
      } catch (error) {
        console.error(`Error polling match ${matchId}:`, error);
      }
    }, 30000); // 30 seconds

    this.pollingIntervals.set(matchId, interval);
  }

  stopPolling(matchId: string) {
    const interval = this.pollingIntervals.get(matchId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(matchId);
    }
  }

  stopAllPolling() {
    this.pollingIntervals.forEach((interval) => clearInterval(interval));
    this.pollingIntervals.clear();
  }
}
```

**2.2 Add Match Scheduler**
```typescript
// backend/src/matches/match-scheduler.service.ts
@Injectable()
export class MatchSchedulerService implements OnModuleInit {
  constructor(
    private matchesService: MatchesService,
    private liveMatchService: LiveMatchService
  ) {}

  onModuleInit() {
    // Check for live matches every 5 minutes
    setInterval(() => this.checkLiveMatches(), 5 * 60 * 1000);
    
    // Initial check
    this.checkLiveMatches();
  }

  private async checkLiveMatches() {
    try {
      const today = new Date();
      const matches = await this.matchesService.getMatchesByDate(today);
      
      matches.forEach(match => {
        const matchTime = new Date(match.utcDate);
        const now = new Date();
        const diffMinutes = (now.getTime() - matchTime.getTime()) / 1000 / 60;
        
        // Match is live if within 0-120 minutes from start
        if (diffMinutes >= 0 && diffMinutes <= 120) {
          this.liveMatchService.startPolling(match.id.toString());
        } else {
          this.liveMatchService.stopPolling(match.id.toString());
        }
      });
    } catch (error) {
      console.error('Error checking live matches:', error);
    }
  }
}
```

---

### Phase 3: Frontend WebSocket Integration (Days 3-4)

**3.1 Install Dependencies**
```bash
cd frontend
npm install socket.io-client rxjs
```

**3.2 Create WebSocket Service**
```typescript
// frontend/src/app/core/services/websocket.service.ts
@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  connectionState$ = new BehaviorSubject<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  constructor(private authService: AuthService) {}

  connect() {
    const token = this.authService.getToken();
    
    this.socket = io(`${environment.wsUrl}/matches`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.connectionState$.next('connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.connectionState$.next('disconnected');
    });

    this.socket.on('reconnect_attempt', () => {
      this.reconnectAttempts++;
      this.connectionState$.next('reconnecting');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on<T>(event: string): Observable<T> {
    return new Observable(observer => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      this.socket.on(event, (data: T) => {
        observer.next(data);
      });

      return () => {
        if (this.socket) {
          this.socket.off(event);
        }
      };
    });
  }
}
```

**3.3 Create Live Match Service**
```typescript
// frontend/src/app/features/matches/services/live-match.service.ts
@Injectable({ providedIn: 'root' })
export class LiveMatchService {
  private subscribedMatches = new Set<string>();

  constructor(private wsService: WebSocketService) {}

  subscribeToMatch(matchId: string): Observable<MatchUpdate> {
    if (!this.subscribedMatches.has(matchId)) {
      this.wsService.emit('subscribe-match', matchId);
      this.subscribedMatches.add(matchId);
    }

    return this.wsService.on<MatchUpdate>('match-update').pipe(
      filter(update => update.matchId === matchId)
    );
  }

  unsubscribeFromMatch(matchId: string) {
    if (this.subscribedMatches.has(matchId)) {
      this.wsService.emit('unsubscribe-match', matchId);
      this.subscribedMatches.delete(matchId);
    }
  }

  unsubscribeAll() {
    this.subscribedMatches.forEach(matchId => {
      this.wsService.emit('unsubscribe-match', matchId);
    });
    this.subscribedMatches.clear();
  }
}
```

---

### Phase 4: UI Components (Days 4-5)

**4.1 Live Indicator Component**
```typescript
// frontend/src/app/shared/components/live-indicator/live-indicator.component.ts
@Component({
  selector: 'app-live-indicator',
  template: `
    <div class="live-indicator" [class.live]="isLive">
      <span class="dot"></span>
      <span class="text">{{ isLive ? 'LIVE' : 'ENDED' }}</span>
    </div>
  `,
  styles: [`
    .live-indicator {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ion-color-medium);
    }
    .live .dot {
      background: var(--ion-color-danger);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class LiveIndicatorComponent {
  @Input() isLive = false;
}
```

**4.2 Update Match Card Component**
```typescript
// Add to existing match-card.component.ts
export class MatchCardComponent implements OnInit, OnDestroy {
  @Input() match!: Match;
  liveUpdate$!: Observable<MatchUpdate>;
  private destroy$ = new Subject<void>();

  constructor(private liveMatchService: LiveMatchService) {}

  ngOnInit() {
    if (this.isMatchLive()) {
      this.liveUpdate$ = this.liveMatchService
        .subscribeToMatch(this.match.id.toString())
        .pipe(takeUntil(this.destroy$));

      this.liveUpdate$.subscribe(update => {
        // Update match data in real-time
        this.match.score = update.score;
        this.match.status = update.status;
      });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.liveMatchService.unsubscribeFromMatch(this.match.id.toString());
  }

  private isMatchLive(): boolean {
    return this.match.status === 'IN_PLAY' || this.match.status === 'PAUSED';
  }
}
```

---

## Testing Strategy

### Unit Tests
- WebSocket gateway connection/disconnection
- Live match service polling logic
- Match scheduler start/stop logic
- Frontend service subscription management

### E2E Tests
```typescript
describe('Real-time Match Updates', () => {
  it('should receive live score updates', (done) => {
    const client = io('http://localhost:3000/matches');
    
    client.on('connect', () => {
      client.emit('subscribe-match', '12345');
    });

    client.on('match-update', (update) => {
      expect(update).toHaveProperty('matchId');
      expect(update).toHaveProperty('score');
      done();
    });
  });
});
```

### Performance Tests
- Test with 100+ concurrent connections
- Measure memory usage during polling
- Monitor CPU usage during broadcasts

---

## Deployment Checklist

- [ ] Add WebSocket support to docker-compose
- [ ] Configure CORS for WebSocket connections
- [ ] Set environment variable for WS_URL
- [ ] Add monitoring for WebSocket connections
- [ ] Document WebSocket events in API docs
- [ ] Add health check endpoint for WebSocket
- [ ] Configure load balancer for sticky sessions (if multi-instance)

---

## Environment Variables

```bash
# Backend .env
WS_CORS_ORIGIN=http://localhost:8100,https://footdash.com
LIVE_MATCH_POLL_INTERVAL=30000  # 30 seconds
LIVE_MATCH_CHECK_INTERVAL=300000  # 5 minutes

# Frontend environment.ts
wsUrl: 'http://localhost:3000'  # or wss://api.footdash.com for production
```

---

## Success Criteria

- ✅ WebSocket connections stable for 1+ hour
- ✅ Score updates delivered within 30-60 seconds
- ✅ Reconnection works after network interruption
- ✅ No memory leaks during long sessions
- ✅ UI updates without flickering
- ✅ Mobile app receives updates when backgrounded

---

## Next Steps After This Feature

1. Integrate with push notifications (send push when user not viewing app)
2. Add more granular events (goals, cards, substitutions)
3. Add live commentary/timeline
4. Optimize polling with webhooks (if API supports)
