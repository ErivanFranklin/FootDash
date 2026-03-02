# FootDash — State Management Guide

> Last updated: March 2, 2026 (Phase 12)

## 1. Guiding Principles

| Principle | Explanation |
|-----------|-------------|
| **Single Source of Truth** | Global state lives in the NgRx Store; components read via selectors, never maintain duplicate copies. |
| **State is Read-Only** | Only reducers may transform state; components and services dispatch actions or call facade methods. |
| **Changes are Pure** | Reducers are pure functions — no side effects, no API calls, no random values. |
| **Side Effects in Effects** | All async work (HTTP, WebSocket, localStorage) lives in Effects or SignalStore `rxMethod`s. |

---

## 2. When to Use NgRx vs Local State

| Use NgRx Store When… | Use Component / Signal State When… |
|-----------------------|-------------------------------------|
| State is shared across multiple routes or modules | State is ephemeral (e.g., form input, animation toggle) |
| State survives navigation (auth, user prefs, notification badge) | State resets when the component is destroyed |
| State is derived from server data that must be cached or synchronized | State is only read by the component that owns it |
| Debugging/time-travel is valuable (complex flows) | Simple boolean or counter (loading, showModal) |

**Rule of thumb:** If more than one component/page needs the same reactive data, consider the Store. If only one component uses it, keep it local.

---

## 3. Folder Structure

```
frontend/src/app/store/
  app.state.ts                       ← Root AppState interface
  index.ts                           ← Re-exports for convenience

  auth/
    auth.actions.ts
    auth.reducer.ts
    auth.selectors.ts
    auth.effects.ts
    auth.facade.ts                   ← Facade (optional, recommended)
    index.ts

  notifications/
    notifications.store.ts           ← NgRx SignalStore (self-contained)

  billing/
    billing.store.ts                 ← NgRx SignalStore

  offline/
    offline.store.ts                 ← NgRx SignalStore

  gamification/
    gamification.store.ts            ← NgRx SignalStore (already exists)
```

### Classic NgRx vs SignalStore

| Pattern | When to use |
|---------|-------------|
| **Classic NgRx** (actions + reducer + effects + selectors) | Complex global state with many actions and cross-feature dependencies (e.g., Auth) |
| **NgRx SignalStore** (`signalStore()`) | Feature-scoped state that benefits from Angular Signals; simpler boilerplate |

Both are valid inside the `store/` directory. Choose based on complexity and team familiarity.

---

## 4. Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Actions | `[Feature] Verb Noun` | `[Auth] Login`, `[Notifications] Mark As Read` |
| Action creators | `camelCase` with feature prefix | `authLogin`, `notificationsMarkAsRead` |
| Reducer | `{feature}Reducer` | `authReducer` |
| Feature key | `{feature}` (string constant) | `'auth'` |
| Selectors | `select{Feature}{Property}` | `selectAuthToken`, `selectIsAuthenticated` |
| Effects | `{verb}{Noun}Effect` | `loginEffect`, `loadAlertsEffect` |
| Facades | `{Feature}Facade` | `AuthFacade` |
| SignalStore | `{Feature}Store` | `GamificationStore`, `NotificationsStore` |

---

## 5. Facade Pattern

Facades are **optional but recommended** for classic NgRx slices. They encapsulate `Store.dispatch()` and selector subscriptions so that components never import actions or the Store directly.

```typescript
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private store = inject(Store);

  isAuthenticated$ = this.store.select(selectIsAuthenticated);
  token$           = this.store.select(selectToken);
  error$           = this.store.select(selectAuthError);

  login(email: string, password: string): void {
    this.store.dispatch(authLogin({ email, password }));
  }

  logout(): void {
    this.store.dispatch(authLogout());
  }
}
```

For **SignalStore** features, the store itself acts as the facade — inject it directly.

---

## 6. Testing Strategy

| Artifact | Test approach |
|----------|--------------|
| **Reducer** | Pure function tests — given state + action → expected new state |
| **Selectors** | `projector()` tests — verify computation without Store |
| **Effects** | Use `provideMockActions()` + mock services; verify emitted actions |
| **SignalStore** | Inject store in `TestBed`; call methods and assert signal values |
| **Facades** | Spy on `Store.dispatch` / `Store.select` |

---

## 7. Migration Checklist (per slice)

- [ ] Define state shape and selectors
- [ ] Implement actions / reducer / effects (or SignalStore)
- [ ] Create facade (if classic NgRx)
- [ ] Migrate consumers one component at a time
- [ ] Add unit tests
- [ ] Verify Redux DevTools actions/state
- [ ] Check bundle size (before/after)
- [ ] Remove deprecated BehaviorSubjects / local state
- [ ] Update this doc if patterns change
