import { Injectable, OnDestroy } from '@angular/core';
import { WebSocketService } from './web-socket.service';
import { BehaviorSubject, Observable, filter, map } from 'rxjs';

export interface LiveMatchUpdate {
  matchId: string;
  score: {
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
  };
  status: string;
  minute?: number;
  timestamp: Date;
}

export interface MatchState {
  matchId: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  minute?: number;
  isLive: boolean;
  lastUpdate: Date;
}

@Injectable({
  providedIn: 'root',
})
export class LiveMatchService implements OnDestroy {
  private matchStates = new Map<string, BehaviorSubject<MatchState>>();
  private liveMatchIds = new Set<string>();

  constructor(private wsService: WebSocketService) {
    // Listen to all WebSocket match updates
    this.wsService.onMatchUpdate().subscribe((update: LiveMatchUpdate) => {
      this.handleMatchUpdate(update);
    });
  }

  /**
   * Subscribe to a specific match for live updates
   */
  subscribeToMatch(matchId: number | string): Observable<MatchState> {
    const id = String(matchId);
    
    // Subscribe via WebSocket
    this.wsService.subscribeToMatch(Number(id));
    
    // Create or get the match state subject
    if (!this.matchStates.has(id)) {
      const initialState: MatchState = {
        matchId: id,
        homeScore: null,
        awayScore: null,
        status: 'UNKNOWN',
        isLive: false,
        lastUpdate: new Date(),
      };
      this.matchStates.set(id, new BehaviorSubject(initialState));
    }

    return this.matchStates.get(id)!.asObservable();
  }

  /**
   * Unsubscribe from a specific match
   */
  unsubscribeFromMatch(matchId: number | string): void {
    const id = String(matchId);
    this.wsService.unsubscribefromMatch(Number(id));
    
    // Optional: Clean up the state if no longer needed
    // this.matchStates.delete(id);
  }

  /**
   * Get current state of a match (synchronous)
   */
  getMatchState(matchId: number | string): MatchState | null {
    const id = String(matchId);
    return this.matchStates.get(id)?.value || null;
  }

  /**
   * Check if a match is currently live
   */
  isMatchLive(matchId: number | string): boolean {
    return this.liveMatchIds.has(String(matchId));
  }

  /**
   * Get all live match IDs
   */
  getLiveMatchIds(): string[] {
    return Array.from(this.liveMatchIds);
  }

  /**
   * Initialize match state from initial data (e.g., from API)
   */
  initializeMatchState(matchId: number | string, initialData: Partial<MatchState>): void {
    const id = String(matchId);
    const currentState = this.matchStates.get(id)?.value;
    
    const newState: MatchState = {
      matchId: id,
      homeScore: initialData.homeScore ?? currentState?.homeScore ?? null,
      awayScore: initialData.awayScore ?? currentState?.awayScore ?? null,
      status: initialData.status ?? currentState?.status ?? 'UNKNOWN',
      minute: initialData.minute ?? currentState?.minute,
      isLive: this.checkIfLive(initialData.status ?? currentState?.status ?? 'UNKNOWN'),
      lastUpdate: new Date(),
    };

    if (this.matchStates.has(id)) {
      this.matchStates.get(id)!.next(newState);
    } else {
      this.matchStates.set(id, new BehaviorSubject(newState));
    }

    if (newState.isLive) {
      this.liveMatchIds.add(id);
    } else {
      this.liveMatchIds.delete(id);
    }
  }

  /**
   * Handle incoming WebSocket updates
   */
  private handleMatchUpdate(update: LiveMatchUpdate): void {
    const id = update.matchId;
    const isLive = this.checkIfLive(update.status);

    const newState: MatchState = {
      matchId: id,
      homeScore: update.score.fullTime.home,
      awayScore: update.score.fullTime.away,
      status: update.status,
      minute: update.minute,
      isLive,
      lastUpdate: new Date(update.timestamp),
    };

    if (this.matchStates.has(id)) {
      this.matchStates.get(id)!.next(newState);
    } else {
      this.matchStates.set(id, new BehaviorSubject(newState));
    }

    if (isLive) {
      this.liveMatchIds.add(id);
    } else {
      this.liveMatchIds.delete(id);
    }
  }

  /**
   * Check if a status indicates a live match
   */
  private checkIfLive(status: string): boolean {
    const liveStatuses = ['IN_PLAY', 'LIVE', 'HALFTIME', 'PAUSED', 'IN PLAY'];
    return liveStatuses.some(s => status?.toUpperCase().includes(s));
  }

  ngOnDestroy(): void {
    // Cleanup all subscriptions
    this.matchStates.forEach((_, matchId) => {
      this.unsubscribeFromMatch(matchId);
    });
    this.matchStates.clear();
    this.liveMatchIds.clear();
  }
}
