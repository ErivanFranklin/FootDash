# Phase 7: UI/UX Polish & Navigation Enhancements

## Overview
This phase focuses on refining the user experience, fixing navigation issues, securing the UI context (hiding menus on login), and implementing essential session management (Logout).

## 1. Authentication & Session Management
### Requirements
- [ ] **Logout Functionality**:
    - Add "Log Out" button to `NavigationMenuComponent` and/or Profile page.
    - Clear Secure Storage / Local Storage tokens.
    - Redirect to `/login`.
- [ ] **UI Visibility**:
    - Hide `ion-tab-bar` (bottom tabs) on Login/Register pages.
    - Disable/Hide `ion-menu` (side drawer) on Login/Register pages.
    - Use `AuthService` observable (`isAuthenticated$`) in `AppComponent`.

## 2. Navigation Fixes
### Requirements
- [ ] **Fix Routing Errors**:
    - Investigate and fix `NG04002: 'tabs/feed'`.
    - Ensure `ion-tabs` is correctly configured (using `ion-router-outlet` vs independent routes).
    - If using standalone top-level routes, ensure `ion-tab-button` uses `href` or `routerLink` correctly without conflicting `tab` property logic if strictly necessary.
- [ ] **Back Navigation**:
    - Ensure `ion-back-button` is present in `ion-toolbar` on all detail/child pages:
        - `MatchDetailsPage`
        - `TeamAnalyticsPage`
        - `MatchPredictionPage`
        - `UserProfilePage`
        - `MatchDiscussionPage`
- [ ] **Automated Navigation Testing**:
    - Create a Spec file (e.g., `navigation.spec.ts`) to verify all route paths resolve correctly.
    - Use Angular Router testing harness.

## 3. UI/UX Enhancements
### Requirements
- [ ] **Visual Polish**:
    - Consistent color scheme (primary/secondary).
    - Improve spacing/padding in Lists and Cards.
    - Add loading indicators/skeletons while fetching data.
- [ ] **Responsive Design**:
    - Ensure bottom tabs only show on Mobile (hidden on Desktop?).
    - Ensure Side Menu is persistent or togglable on Desktop.

## Implementation Plan

### Step 1: Secure UI Context (Immediate)
Modify `app.component.ts` and `app.component.html`:
```html
<ion-app>
  <ng-container *ngIf="isAuthenticated$ | async">
    <ion-menu>...</ion-menu>
    <ion-tabs>...</ion-tabs>
  </ng-container>
  <ion-router-outlet></ion-router-outlet>
</ion-app>
```

### Step 2: Fix Routing
Debug the `tabs/feed` error. It is likely `ion-tabs` trying to do internal routing while our routes are flat.

### Step 3: Global Logout
Add `logout()` method to `AuthService` and bind it to UI.

### Step 4: Back Buttons
Audit all pages and add:
```html
<ion-buttons slot="start">
  <ion-back-button defaultHref="/home"></ion-back-button>
</ion-buttons>
```
