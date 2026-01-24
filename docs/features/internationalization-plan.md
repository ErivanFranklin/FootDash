# Internationalization (i18n) Implementation Plan

**Feature Branch:** `feature/phase-5-i18n`
**Phase:** 5 (Global Intelligence)
**Duration:** 1 Week

## 1. Overview
Implement comprehensive multi-language support to allow users to toggle between English, Portuguese (Brazil), and Spanish instantly without reloading the application.

## 2. Technical Strategy

### Library Choice: `@jsverse/transloco` (formerly @ngneat/transloco)
*   **Why:** Allows runtime language switching (Angular's native i18n requires separate builds per language).
*   **Features:** Lazy loading translations, caching, structural directives.

### Structure
```
src/assets/i18n/
├── en.json  (Source)
├── pt.json
└── es.json
```

### Key Components

#### 1. Configuration (`transloco-root.module.ts`)
- Default language: `en`
- Available langs: `['en', 'pt', 'es']`
- Re-render strategy: `ReRenderOnLangChange`

#### 2. Translation Service (`LanguageService`)
- Manages active language state in `localStorage`.
- Sets `document.documentElement.lang` for a11y.
- Handles logic for Date/Currency formatting based on locale.

## 3. Implementation Checklist

### Step 1: Core Setup
- [ ] `npm install @jsverse/transloco`
- [ ] Run setup builder to generate module.
- [ ] Create `en.json`, `pt.json`, `es.json` skeleton files.

### Step 2: Global UI Translation (The "Shell")
- [ ] **Tab Bar:** Home, Matches, Feed, Profile.
- [ ] **Headers:** "Today's Matches", "Live", "Settings".
- [ ] **Auth Pages:** Login/Register forms, Button labels, Error validation messages.

### Step 3: Dynamic Data Translation
- [ ] **Match Status:** Map API values (`FINISHED`, `IN_PLAY`) to display keys (`STATUS.FT`, `STATUS.LIVE`).
- [ ] **Dates:** Create a helper pipe/service to format existing ISO dates using the active locale (e.g., `DatePipe` with dynamic locale).

### Step 4: Settings Interface
- [ ] Add "Language" section to User Profile / Settings page.
- [ ] Component: Language Selector (Action Sheet or Radio List).
- [ ] Implementation: Calls `translocoService.setActiveLang()`.

## 4. Translation Dictionary Draft

**en.json**
```json
{
  "COMMON": {
    "LOADING": "Loading...",
    "ERROR": "Something went wrong",
    "CANCEL": "Cancel",
    "CONFIRM": "Confirm"
  },
  "NAV": {
    "HOME": "Home",
    "MATCHES": "Matches",
    "FEED": "Feed",
    "PROFILE": "Profile"
  },
  "MATCH_STATUS": {
    "LIVE": "Live",
    "FT": "Full Time",
    "HT": "Half Time",
    "UPCOMING": "Scheduled"
  },
  "AUTH": {
    "LOGIN": "Sign In",
    "REGISTER": "Create Account",
    "EMAIL_PLACEHOLDER": "Enter your email"
  }
}
```

## 5. Verification
- **Functional:** Changing language updates all text instantly.
- **Persistence:** Reloading the app remembers the last chosen language.
- **A11y:** Screen readers detect correct language context.
