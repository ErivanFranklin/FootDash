# Phase 5 Development Plan: Global Intelligence

## Overview
**The "Global Intelligence" Phase.**
Building on the solid Mobile PWA foundation (Phase 4), Phase 5 focuses on expanding the application's reach through **Internationalization (i18n)** and deepening user engagement through **Advanced Analytics**. This phase transforms FootDash from a match tracker into a global, data-driven football companion.

**Estimated Duration:** 4 Weeks
**Primary Goals:**
1.  Global Reach: Support multiple languages (EN, PT, ES, FR).
2.  Deep Insights: Interactive charts, team comparisons, and match predictions.
3.  User Retention: Personalized dashboards and "Pro" insights.

---

## Architecture roadmap

### 1. Internationalization (i18n)
*   **Strategy:** Use `@angular/localize` or `Transloco` (simpler for dynamic switching) for frontend translations.
*   **Scope:** 
    - Static text (menus, labels, buttons).
    - Dynamic data (date formats, currency, numbers).
    - Backend support for localized content (e.g., entity names if needed, though usually football data is standard).
*   **Languages:** English (Default), Portuguese (Brazil), Spanish, French.

### 2. Analytics Engine (Backend)
*   **Micro-module:** `AnalyticsModule` in NestJS.
*   **Features:**
    - **Form Calculation:** Rolling 5-game performance analysis.
    - **Head-to-Head (H2H):** Historical aggregation between two teams.
    - **Prediction Algorithm:** Heuristic-based weighing of Home Advantage + Form + H2H.
*   **Database:** New entities `TeamStats`, `PlayerStats`, `MatchPrediction`.

### 3. Data Visualization (Frontend)
*   **Library:** `ng2-charts` (Chart.js wrapper) or `ngx-charts` (D3-based).
*   **Components:**
    - `WinProbabilityChart`: Donut/Pie chart for match outcomes.
    - `FormTrendChart`: Line chart showing goals/points over time.
    - `RadarComparison`: Hexagonal chart comparing Team A vs Team B (Attack, Defense, Possession, etc.).

---

## Detailed Sprint Plan

### Week 1: Foundation of Language (i18n)
| Day | Task | Description |
| --- | --- | --- |
| 1 | **Scaffold i18n** | Install `Transloco`, set up translation files structure (`assets/i18n/`). |
| 2-3 | **Translate Shell** | Apply pipes to Sidebar, TabBar, Login, and Shared Components. |
| 4 | **Dynamic Formats** | Configure Date/Time pipes/services for locale-awareness. |
| 5 | **Language Switcher** | Build a robust Settings UI for changing language preference. |

### Week 2: Analytics Backend Integration
*(Ref: `docs/features/advanced-analytics-ai-plan.md`)*
| Day | Task | Description |
| --- | --- | --- |
| 1-2 | **Entities** | Create `MatchPrediction` and `TeamAnalytics` entities & DTOs. |
| 3 | **Logic Service** | Implement `PredictionService` (e.g., Win Probability calc). |
| 4-5 | **API Endpoints** | Expose `/api/analytics/match/:id` and `/api/analytics/team/:id`. |

### Week 3: Visual Analytics Components
| Day | Task | Description |
| --- | --- | --- |
| 1 | **Chart Setup** | Integrate Chart.js/ng2-charts. Config theming (Dark/Light). |
| 2-3 | **Match Widgets** | Build "Win Probability" and "Stats Comparison" widgets for Match Detail. |
| 4-5 | **Team Dashboard** | Create a `TeamAnalyticsPage` with historical trend lines. |

### Week 4: Polish & Integration
| Day | Task | Description |
| --- | --- | --- |
| 1-2 | **Integration** | Embed Analytics widgets into the existing PWA `MatchDetail` page. |
| 3 | **Premium Gate** | (Optional) Create a mock "Upgrade to Pro" overlay for advanced stats. |
| 4-5 | **QA & Launch** | Full regression test of i18n + Performance check on charts. |

---

## Technical Considerations

### Dependencies
- **Frontend:**
  - `@ngneat/transloco` (Recommended for flexibility)
  - `chart.js` & `ng2-charts`
- **Backend:**
  - Standard NestJS libraries.

### Performance
- **Lazy Loading i18n:** Load translation chunks only when needed.
- **Chart Rendering:** Ensure charts heavily use `ChangeDetectionStrategy.OnPush` to avoid strict repaint loops.
