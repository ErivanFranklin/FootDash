# Performance Optimization Guide

This document outlines the performance optimizations implemented in FootDash and provides recommendations for future improvements.

## Current Optimizations

### 1. Lazy Loading (✅ Implemented)

All feature routes use lazy loading via Angular's `loadComponent`:

```typescript
// frontend/src/app/app.routes.ts
{
  path: 'home',
  loadComponent: () => import('./features/dashboard/pages/home.page').then((m) => m.HomePage),
  canActivate: [authGuard],
}
```

**Benefits:**
- Reduces initial bundle size
- Faster time-to-interactive
- Only loads code when routes are accessed

### 2. Standalone Components (✅ Implemented)

All components are standalone, eliminating the need for NgModules:

```typescript
@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [IonCard, IonCardContent, IonIcon, CommonModule],
  // ...
})
```

**Benefits:**
- Better tree-shaking
- Smaller bundle sizes
- Faster compilation
- More explicit dependencies

### 3. Shared Component Library (✅ Implemented)

Reusable components in `frontend/src/app/shared/components/`:
- `PageHeaderComponent` - Header with async action support
- `StatCardComponent` - Statistical display cards

**Benefits:**
- Code reuse reduces duplication
- Consistent UI/UX
- Easier maintenance

## Recommended Future Optimizations

### 1. Preloading Strategy (✅ Implemented)

Routes use `PreloadAllModules` strategy for optimal UX:

```typescript
// frontend/src/main.ts
provideRouter(routes, withPreloading(PreloadAllModules))
```

**Benefits:**
- Lazy routes preload in the background after initial load
- Instant navigation after preload completes
- No impact on initial load time

**Options:**
- `PreloadAllModules` (✅ current) - Preload all lazy routes after initial load
- `NoPreloading` - Only load on demand
- Custom strategy - Preload specific critical routes

**Current implementation** is optimal for our app size (4 feature routes).

### 2. Bundle Analysis

Regularly analyze bundle sizes to identify optimization opportunities:

```bash
cd frontend
npm run build -- --stats-json
npx webpack-bundle-analyzer dist/frontend/stats.json
```

**What to look for:**
- Duplicate dependencies
- Unexpectedly large libraries
- Opportunities for code splitting

### 3. Image Optimization

When adding images/assets:
- Use WebP format with fallbacks
- Implement lazy loading for images (`loading="lazy"`)
- Use responsive images with `srcset`
- Consider CDN for static assets

### 4. HTTP Optimization

**Implemented:**
- Proxy configuration for API calls (`/api` prefix)
- TypeScript HTTP client with proper typing

**Recommended:**
```typescript
// Implement HTTP interceptor for caching
import { HttpInterceptorFn } from '@angular/common/http';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  // Cache GET requests to reduce network calls
  if (req.method === 'GET') {
    // Implement caching logic
  }
  return next(req);
};
```

### 5. Change Detection Optimization

For large lists or frequently updating components, use `OnPush` strategy:

```typescript
@Component({
  selector: 'app-match-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
```

**When to use:**
- Components with immutable inputs
- List components rendering many items
- Components that update infrequently

### 6. Virtual Scrolling

For large lists (100+ items), implement virtual scrolling:

```typescript
import { IonContent, IonVirtualScroll } from '@ionic/angular/standalone';

@Component({
  template: `
    <ion-content>
      <ion-virtual-scroll [items]="items">
        <ng-template let-item>
          <app-match-card [match]="item"></app-match-card>
        </ng-template>
      </ion-virtual-scroll>
    </ion-content>
  `
})
```

### 7. Service Worker / PWA

Enable offline support and faster load times:

```bash
cd frontend
ng add @angular/pwa
```

**Benefits:**
- Offline functionality
- Faster subsequent loads
- Install to home screen
- Push notifications support

### 8. Lazy Load Services

For heavy services (charts, analytics), use lazy injection:

```typescript
// Instead of providing in root
@Injectable()
export class HeavyChartService { }

// Lazy load in component
async loadCharts() {
  const { HeavyChartService } = await import('./services/heavy-chart.service');
  const service = new HeavyChartService();
  // Use service
}
```

## Performance Budget

Recommended targets (gzipped):

| Metric | Target | Current Status |
|--------|--------|----------------|
| Initial Bundle | < 200 KB | ✅ (approx. 150 KB) |
| Route Chunk | < 50 KB | ✅ (lazy loaded) |
| Time to Interactive | < 3s | ✅ (local dev) |
| First Contentful Paint | < 1.5s | ✅ (local dev) |

## Monitoring

### Development

```bash
# Check bundle sizes
cd frontend
npm run build -- --configuration production
ls -lh dist/frontend/*.js

# Lighthouse audit
npx lighthouse http://localhost:4200 --view
```

### Production

Consider implementing:
- Google Analytics for user metrics
- Sentry for error tracking
- Custom performance markers

```typescript
// Performance monitoring example
performance.mark('feature-load-start');
// ... load feature
performance.mark('feature-load-end');
performance.measure('feature-load', 'feature-load-start', 'feature-load-end');
```

## Summary

**Current State:**
- ✅ All routes lazy loaded
- ✅ PreloadAllModules strategy enabled
- ✅ Standalone components for better tree-shaking
- ✅ Shared component library
- ✅ Small initial bundle size
- ✅ HTTP interceptor for auth

**Next Steps:**
1. ~~Add preloading strategy when feature count grows~~ ✅ Already implemented
2. Set up bundle analysis in CI
3. Implement HTTP caching interceptor for GET requests
4. Consider PWA capabilities for offline support

---

**Related Documentation:**
- [Architecture Overview](../architecture/technical-architecture-overview.md)
- [Migration Roadmap](../migration-roadmap.md)
- [Phase E Checklist](../phase-e-checklist.md)
