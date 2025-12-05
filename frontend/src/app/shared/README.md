# Shared Components

This folder exposes small, reusable UI components used across the FootDash frontend.

Available components (standalone):

- `app-page-header` — Header component with actions and loading states
- `app-loading-spinner` — Centralised loading spinner component
- `app-data-card` — Generic card for displaying key/value data
- `app-match-card` — Card showing match info (teams, date, venue, referee)
- `app-team-card` — Card for team details with actions
- `app-stat-card` — Small, focused statistic card (value, label, optional icon/change)

Usage example for `stat-card`:

```html
<app-stat-card
  label="Possession"
  [value]="62"
  subtitle="vs Team X"
  icon="analytics-outline"
  variant="primary"
  [change]="5">
</app-stat-card>
```

Accessibility notes:
- `app-stat-card` supports `ariaLabel` and `valueAriaLabel` inputs for screen-reader friendly labels.
- Icon elements are marked `aria-hidden` to avoid redundant announcements.
- Change delta is announced with `aria-live="polite"`.

Export barrel: `src/app/shared/components/index.ts` — import components like:

```ts
import { PageHeaderComponent } from 'src/app/shared/components';
```
