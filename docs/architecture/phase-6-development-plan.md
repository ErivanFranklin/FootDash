# Phase 6 Development Plan: Engagement & Monetization

## Overview
**The "Pro" Phase.**
With a robust analytics engine and global reach (i18n), Phase 6 focuses on converting users into subscribers through premium features and deepening engagement through gamification.

**Estimated Duration:** 3-4 Weeks
**Primary Goals:**
1.  **Monetization:** Implement "FootDash Pro" subscription (Stripe/RevenueCat).
2.  **Gamification:** User levels, badges, and prediction leaderboards.
3.  **Social:** Match discussions and sharing advanced stats.

---

## Key Features

### 1. FootDash Pro (Subscription)
*   **Gatekeeper:** Restrict advanced analytics (Radar Charts, Prediction Insights) to Pro users.
*   **Ad-Free Experience:** Remove banner ads (if any).
*   **Priority Alerts:** Faster notification delivery.
*   **Tech Stack:** Stripe API (Backend), Payment Sheet (Frontend).

### 2. Prediction League (Gamification)
*   **User Predictions:** Allow users to vote on match outcomes.
*   **Leaderboards:** Weekly/Monthly ranking of best predictors.
*   **Badges:** Award badges for streaks (e.g., "Oracle", "Loyal Fan").

### 3. Match Discussion (Social)
*   **Live Chat:** Real-time chat room for live matches.
*   **Reactions:** Emoji reactions to match events.
*   **Moderation:** Basic profanity filter and report system.

---

## Proposed Sprint Plan

### Sprint 1: Gamification Foundation
*   Database schema for `UserPrediction`, `Leaderboard`, `Badge`.
*   UI for voting on match results.
*   Calculation job for updating user points.

### Sprint 2: Social Features
*   WebSocket-based Chat rooms per match.
*   Integration with existing Auth system for user profiles.

### Sprint 3: Monetization & Pro Gate
*   Stripe Integration.
*   "Upgrade to Pro" Paywall UI.
*   Permissions guard for Analytics routes.
