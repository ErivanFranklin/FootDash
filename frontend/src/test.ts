// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import { setAssetPath } from '@ionic/core/components';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';
import { Injectable, inject, Injector, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Subscription } from 'rxjs';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Configure Ionic/Stencils asset path to avoid URL errors in Karma/JSDOM
try {
  const base = (document as any).baseURI || (window as any).location?.href || '/';
  setAssetPath(base);
} catch {
  // no-op if document/window not available in certain environments
}

@Injectable({ providedIn: 'root' })
export class LiveMatchService implements OnDestroy {
  private http = inject(HttpClient);
  private injector = inject(Injector);

  private connectionSub?: Subscription;
  private matchUpdateSub?: Subscription;

  // Resolve WebSocketService lazily; return null if not provided
  // Resolve WebSocketService lazily; return null if not provided
  private safeGetWs(): any | null {
    try {
      // Try to get WebSocketService without importing it directly
      const WebSocketService = this.injector.get('WebSocketService' as any, null);
      return WebSocketService;
    } catch {
      return null;
    }
  }
  // Call this from components after construction to begin listening
  startSubscriptions(): void {
    const ws = this.safeGetWs();

    const connection$ =
      ws && typeof (ws as any).connection$?.subscribe === 'function'
        ? (ws as any).connection$
        : EMPTY;

    const matchUpdates$ =
      ws && typeof (ws as any).matchUpdates$?.subscribe === 'function'
        ? (ws as any).matchUpdates$
        : EMPTY;

    this.connectionSub = connection$.subscribe(() => {
      // handle connection status
    });

    this.matchUpdateSub = matchUpdates$.subscribe(() => {
      // handle incoming match updates
    });
  }

  subscribeToMatch(matchId: string): void {
    const ws = this.safeGetWs();
    if (!ws || typeof (ws as any).emit !== 'function') return;
    (ws as any).emit('subscribe-to-match', { matchId });
  }

  unsubscribeFromMatch(matchId: string): void {
    const ws = this.safeGetWs();
    if (!ws || typeof (ws as any).emit !== 'function') return;
    (ws as any).emit('unsubscribe-from-match', { matchId });
  }

  ngOnDestroy(): void {
    this.connectionSub?.unsubscribe();
    this.matchUpdateSub?.unsubscribe();
    this.connectionSub = undefined;
    this.matchUpdateSub = undefined;
  }
}
