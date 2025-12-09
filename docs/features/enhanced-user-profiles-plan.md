# Enhanced User Profiles - Implementation Plan

**Feature Branch:** `feature/enhanced-user-profiles`  
**Priority:** Phase 2 - Priority 3  
**Estimated Duration:** Weeks 5-7  
**Start Date:** December 9, 2025

## Overview
Implement comprehensive user profile management with customizable preferences, settings, and avatar support. This feature enables users to personalize their FootDash experience with theme selection, notification preferences, language settings, and profile customization.

---

## Architecture Overview

### Database Schema
```
UserProfile
├── id (PK)
├── userId (FK -> User.id)
├── avatarUrl
├── displayName
├── bio
├── createdAt
└── updatedAt

UserPreferences
├── id (PK)
├── userId (FK -> User.id)
├── theme ('light' | 'dark' | 'auto')
├── language ('en' | 'es' | 'pt' | 'fr')
├── notificationEnabled
├── emailNotifications
├── pushNotifications
├── favoriteTeamIds (JSON array)
├── timezone
└── updatedAt
```

### API Endpoints

**User Profile:**
- `GET /api/users/:id/profile` - Get user profile
- `PUT /api/users/:id/profile` - Update user profile
- `POST /api/users/:id/avatar` - Upload avatar (multipart/form-data)
- `DELETE /api/users/:id/avatar` - Remove avatar

**User Preferences:**
- `GET /api/users/:id/preferences` - Get user preferences
- `PUT /api/users/:id/preferences` - Update preferences (full or partial)
- `PATCH /api/users/:id/preferences/theme` - Update theme only
- `PATCH /api/users/:id/preferences/notifications` - Update notification settings

### Frontend Structure
```
frontend/src/app/
├── features/
│   └── user-profile/
│       ├── pages/
│       │   ├── profile-edit.page.ts
│       │   ├── settings.page.ts
│       │   └── preferences.page.ts
│       ├── components/
│       │   ├── avatar-upload.component.ts
│       │   ├── theme-selector.component.ts
│       │   ├── language-selector.component.ts
│       │   └── notification-settings.component.ts
│       └── services/
│           └── user-profile.service.ts
├── core/
│   └── services/
│       ├── theme.service.ts
│       └── preferences.service.ts
└── shared/
    └── models/
        ├── user-profile.model.ts
        └── user-preferences.model.ts
```

---

## Implementation Phases

### **Phase 1: Backend Foundation** (Days 1-3)

#### Task 1.1: Database Schema & Migration
- [ ] Create `UserProfile` entity (`backend/src/users/entities/user-profile.entity.ts`)
- [ ] Create `UserPreferences` entity (`backend/src/users/entities/user-preferences.entity.ts`)
- [ ] Generate TypeORM migration for new tables
- [ ] Add foreign key constraints to User table
- [ ] Create indexes on userId columns
- [ ] Run migration and verify schema

**Files to create:**
- `backend/src/users/entities/user-profile.entity.ts`
- `backend/src/users/entities/user-preferences.entity.ts`
- `backend/migrations/[timestamp]-AddUserProfileAndPreferences.ts`

#### Task 1.2: DTOs & Validation
- [ ] Create `CreateProfileDto` with class-validator rules
- [ ] Create `UpdateProfileDto` (partial)
- [ ] Create `UpdatePreferencesDto` with enum validation
- [ ] Create `AvatarUploadDto` with file type/size validation

**Files to create:**
- `backend/src/users/dto/create-profile.dto.ts`
- `backend/src/users/dto/update-profile.dto.ts`
- `backend/src/users/dto/update-preferences.dto.ts`
- `backend/src/users/dto/avatar-upload.dto.ts`

#### Task 1.3: Services Layer
- [ ] Create `UserProfileService` with CRUD operations
- [ ] Create `UserPreferencesService` with preference management
- [ ] Implement avatar upload logic (local storage or S3)
- [ ] Add default preferences creation on user registration
- [ ] Implement preference caching strategy

**Files to create:**
- `backend/src/users/services/user-profile.service.ts`
- `backend/src/users/services/user-preferences.service.ts`
- `backend/src/users/services/avatar-upload.service.ts`

#### Task 1.4: Controllers & Routes
- [ ] Create `UserProfileController` with REST endpoints
- [ ] Create `UserPreferencesController` with REST endpoints
- [ ] Add JWT authentication guards
- [ ] Add ownership validation (users can only edit own profile)
- [ ] Implement file upload middleware for avatars
- [ ] Add rate limiting for avatar uploads

**Files to create/modify:**
- `backend/src/users/controllers/user-profile.controller.ts`
- `backend/src/users/controllers/user-preferences.controller.ts`
- Update `backend/src/users/users.module.ts`

---

### **Phase 2: Backend Testing & Validation** (Days 4-5)

#### Task 2.1: Unit Tests
- [ ] Test `UserProfileService` methods
- [ ] Test `UserPreferencesService` methods
- [ ] Test `AvatarUploadService` file handling
- [ ] Mock database interactions
- [ ] Test validation rules

**Files to create:**
- `backend/src/users/services/user-profile.service.spec.ts`
- `backend/src/users/services/user-preferences.service.spec.ts`
- `backend/src/users/services/avatar-upload.service.spec.ts`

#### Task 2.2: E2E Tests
- [ ] Test profile CRUD endpoints
- [ ] Test preferences update endpoints
- [ ] Test avatar upload/delete flow
- [ ] Test authorization (can't edit other users)
- [ ] Test file upload validation

**Files to create:**
- `backend/test/user-profile.e2e-spec.ts`
- `backend/test/user-preferences.e2e-spec.ts`

---

### **Phase 3: Frontend Foundation** (Days 6-8)

#### Task 3.1: Models & Interfaces
- [ ] Create `UserProfile` interface
- [ ] Create `UserPreferences` interface with enums
- [ ] Create adapters for API responses
- [ ] Define theme constants

**Files to create:**
- `frontend/src/app/shared/models/user-profile.model.ts`
- `frontend/src/app/shared/models/user-preferences.model.ts`
- `frontend/src/app/core/adapters/user-profile-adapter.ts`
- `frontend/src/app/shared/constants/theme.constants.ts`

#### Task 3.2: Core Services
- [ ] Create `UserProfileService` (API calls)
- [ ] Create `PreferencesService` (state management)
- [ ] Create `ThemeService` (CSS variable management)
- [ ] Implement preference persistence (localStorage)
- [ ] Add RxJS state observables for reactive updates

**Files to create:**
- `frontend/src/app/features/user-profile/services/user-profile.service.ts`
- `frontend/src/app/core/services/preferences.service.ts`
- `frontend/src/app/core/services/theme.service.ts`

#### Task 3.3: Reusable Components
- [ ] Create `AvatarUploadComponent` with image preview
- [ ] Create `ThemeSelectorComponent` (light/dark/auto toggle)
- [ ] Create `LanguageSelectorComponent` (dropdown)
- [ ] Create `NotificationSettingsComponent` (toggles)
- [ ] Add loading states and error handling

**Files to create:**
- `frontend/src/app/features/user-profile/components/avatar-upload.component.ts`
- `frontend/src/app/features/user-profile/components/theme-selector.component.ts`
- `frontend/src/app/features/user-profile/components/language-selector.component.ts`
- `frontend/src/app/features/user-profile/components/notification-settings.component.ts`

---

### **Phase 4: Frontend Pages** (Days 9-11)

#### Task 4.1: Profile Edit Page
- [ ] Create profile edit page with form
- [ ] Integrate `AvatarUploadComponent`
- [ ] Add display name and bio fields
- [ ] Implement save/cancel buttons
- [ ] Add validation feedback
- [ ] Show success/error toasts

**Files to create:**
- `frontend/src/app/features/user-profile/pages/profile-edit.page.ts`
- `frontend/src/app/features/user-profile/pages/profile-edit.page.html`
- `frontend/src/app/features/user-profile/pages/profile-edit.page.scss`

#### Task 4.2: Settings Page
- [ ] Create settings page layout
- [ ] Integrate `ThemeSelectorComponent`
- [ ] Integrate `LanguageSelectorComponent`
- [ ] Integrate `NotificationSettingsComponent`
- [ ] Add sections for different setting categories
- [ ] Implement auto-save or save button

**Files to create:**
- `frontend/src/app/features/user-profile/pages/settings.page.ts`
- `frontend/src/app/features/user-profile/pages/settings.page.html`
- `frontend/src/app/features/user-profile/pages/settings.page.scss`

#### Task 4.3: Routing & Navigation
- [ ] Add routes to app routing module
- [ ] Add "Settings" menu item to main navigation
- [ ] Add "Profile" menu item to user menu
- [ ] Implement route guards (authentication required)

**Files to modify:**
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/components/navigation.component.ts` (if exists)

---

### **Phase 5: Styling & Theming** (Days 12-13)

#### Task 5.1: Theme Implementation
- [ ] Define CSS variables for light theme
- [ ] Define CSS variables for dark theme
- [ ] Create theme switching logic in `ThemeService`
- [ ] Apply theme to global styles
- [ ] Test theme persistence on page reload
- [ ] Support auto theme (system preference detection)

**Files to create/modify:**
- `frontend/src/theme/variables-light.scss`
- `frontend/src/theme/variables-dark.scss`
- Update `frontend/src/global.scss`

#### Task 5.2: Component Styling
- [ ] Style avatar upload component (Ionic design)
- [ ] Style theme selector with visual preview
- [ ] Style language selector dropdown
- [ ] Style notification settings toggles
- [ ] Style profile edit form
- [ ] Style settings page layout
- [ ] Add responsive design (mobile-first)

**Files to style:**
- All component `.scss` files created in Phase 3 & 4

---

### **Phase 6: Testing & Integration** (Days 14-16)

#### Task 6.1: Frontend Unit Tests
- [ ] Test `UserProfileService` API calls
- [ ] Test `PreferencesService` state management
- [ ] Test `ThemeService` CSS variable updates
- [ ] Test component logic and interactions
- [ ] Mock HTTP requests with Jasmine/Karma

**Files to create:**
- `frontend/src/app/features/user-profile/services/user-profile.service.spec.ts`
- `frontend/src/app/core/services/preferences.service.spec.ts`
- `frontend/src/app/core/services/theme.service.spec.ts`
- Component spec files (`.spec.ts`)

#### Task 6.2: E2E Tests
- [ ] Test profile edit flow (Playwright)
- [ ] Test avatar upload flow
- [ ] Test theme switching
- [ ] Test preference saving
- [ ] Test navigation between pages

**Files to create:**
- `frontend/tests/user-profile.spec.ts`
- `frontend/tests/settings.spec.ts`

#### Task 6.3: Integration Testing
- [ ] Test full backend-frontend flow
- [ ] Verify theme persistence across sessions
- [ ] Verify avatar upload and display
- [ ] Test error scenarios (network failures)
- [ ] Verify notifications preference integration

---

### **Phase 7: Documentation & Deployment** (Days 17-18)

#### Task 7.1: API Documentation
- [ ] Document all profile/preferences endpoints (Swagger)
- [ ] Add request/response examples
- [ ] Document authentication requirements
- [ ] Document file upload constraints (avatar)

**Files to create/update:**
- Update Swagger decorators in controllers
- `docs/api/user-profile-endpoints.md`

#### Task 7.2: User Documentation
- [ ] Create user guide for profile editing
- [ ] Document theme switching
- [ ] Document notification preferences
- [ ] Add screenshots to docs

**Files to create:**
- `docs/features/user-profiles-guide.md`

#### Task 7.3: Deployment Preparation
- [ ] Update environment variables (avatar storage config)
- [ ] Run migrations on staging
- [ ] Test on staging environment
- [ ] Prepare rollback plan
- [ ] Update CI/CD pipeline if needed

**Files to update:**
- `backend/.env.example`
- `.github/workflows/` (if changes needed)

---

## Technical Decisions

### Avatar Storage
**Options:**
1. **Local File System** (simpler, for MVP)
   - Store in `backend/uploads/avatars/`
   - Serve via static file middleware
   - Size limit: 2MB, formats: jpg/png/webp

2. **AWS S3** (scalable, for production)
   - Use `@aws-sdk/client-s3`
   - Generate signed URLs
   - Set expiration policies

**Decision:** Start with local file system for MVP, design for easy S3 migration.

### Theme Implementation
**Approach:**
- CSS custom properties (CSS variables) for theming
- Store preference in localStorage for persistence
- Use `prefers-color-scheme` media query for auto mode
- Apply theme class to `<body>` element

### State Management
**Approach:**
- Use RxJS BehaviorSubject for preferences state
- Sync with localStorage on changes
- Emit updates to subscribers (reactive pattern)
- No need for NgRx yet (keep simple)

### Validation Rules
**Profile:**
- Display name: 3-50 characters, alphanumeric + spaces
- Bio: max 500 characters
- Avatar: max 2MB, jpg/png/webp only

**Preferences:**
- Theme: enum ('light', 'dark', 'auto')
- Language: enum ('en', 'es', 'pt', 'fr')
- Notifications: boolean flags

---

## Dependencies

### Backend
```json
{
  "@nestjs/platform-express": "^10.x", // Already installed
  "multer": "^1.4.5-lts.1",             // For file uploads
  "class-validator": "^0.14.0",         // Already installed
  "class-transformer": "^0.5.1"         // Already installed
}
```

### Frontend
```json
{
  "@ionic/angular": "^8.x",             // Already installed
  "@angular/forms": "^20.x",            // Already installed
  "rxjs": "^7.8.0"                      // Already installed
}
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large avatar uploads slow down API | Medium | Add file size validation (2MB max), compress images client-side |
| Theme flickering on page load | Low | Store theme in localStorage, apply before Angular bootstrap |
| Migration breaks existing users | High | Add default preferences on migration, test rollback plan |
| Avatar storage fills disk | Medium | Implement cleanup cron, set quotas, plan S3 migration |
| Preference sync across devices | Low | Out of scope for MVP, plan for future WebSocket sync |

---

## Success Criteria

### Backend
- ✅ All API endpoints return correct status codes
- ✅ Avatar uploads work with validation
- ✅ Preferences persist correctly
- ✅ E2E tests pass (>90% coverage)
- ✅ No performance degradation on profile queries

### Frontend
- ✅ Theme switches without page reload
- ✅ Preferences save automatically/on button click
- ✅ Avatar preview works before upload
- ✅ All forms have proper validation
- ✅ Responsive on mobile and desktop
- ✅ Unit tests pass (>80% coverage)

### Integration
- ✅ Theme preference persists across sessions
- ✅ Avatar displays correctly after upload
- ✅ Notification preferences integrate with push service
- ✅ Language selection works (if i18n implemented)

---

## Post-MVP Enhancements

1. **Avatar Cropping:** Add client-side image cropper before upload
2. **Profile Visibility:** Add public/private profile toggle
3. **Social Links:** Allow users to add social media links
4. **Activity History:** Show user's recent activity
5. **Two-Factor Auth Settings:** Add 2FA enable/disable
6. **Data Export:** Allow users to download their data (GDPR)
7. **Account Deletion:** Implement self-service account deletion

---

## Timeline Summary

| Phase | Duration | Tasks |
|-------|----------|-------|
| Phase 1: Backend Foundation | Days 1-3 | Schema, DTOs, Services, Controllers |
| Phase 2: Backend Testing | Days 4-5 | Unit tests, E2E tests |
| Phase 3: Frontend Foundation | Days 6-8 | Models, Services, Components |
| Phase 4: Frontend Pages | Days 9-11 | Profile Edit, Settings, Routing |
| Phase 5: Styling & Theming | Days 12-13 | CSS variables, Component styles |
| Phase 6: Testing & Integration | Days 14-16 | Unit tests, E2E tests, Integration |
| Phase 7: Documentation & Deployment | Days 17-18 | API docs, User guide, Deployment |

**Total Estimated Duration:** 18 working days (~3.5 weeks)

---

## Next Steps

1. Review and approve this plan
2. Start Phase 1: Backend Foundation
3. Create initial migration for UserProfile and UserPreferences
4. Begin implementing UserProfileService

**Questions to resolve before starting:**
- Confirm avatar storage strategy (local vs S3)
- Confirm supported languages for i18n
- Confirm notification integration points
- Review database schema for any adjustments
