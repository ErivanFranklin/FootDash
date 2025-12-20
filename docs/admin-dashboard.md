# Admin Dashboard - Implementation Guide

## Overview
The Admin Dashboard provides administrators with tools to manage users, moderate content, and monitor system health. This feature is part of Priority 6 of Phase 2 development.

## Architecture

### Backend Components

#### 1. **User Entity Enhancement**
- **File:** `backend/src/users/user.entity.ts`
- **Changes:**
  - Added `UserRole` enum: `USER | ADMIN`
  - Added `role` column (default: `USER`)
  - Added `blocked_at` column (nullable) for tracking blocked users
- **Migration:** `1703084800000-AddRoleToUsers.ts`

#### 2. **AdminGuard**
- **File:** `backend/src/auth/guards/admin.guard.ts`
- **Purpose:** Protects admin-only endpoints
- **Logic:** Verifies user has `ADMIN` role before allowing access
- **Usage:** Applied to all admin API endpoints

#### 3. **AdminService**
- **File:** `backend/src/admin/services/admin.service.ts`
- **Methods:**
  ```typescript
  // User Management
  getAllUsers(limit, offset)        // Get paginated users list
  searchUsers(email, limit)         // Search users by email
  getUserDetails(userId)            // Get specific user details
  blockUser(userId)                 // Block a user account
  unblockUser(userId)               // Unblock a user account
  deleteUser(userId)                // Delete a user account
  
  // Report Management
  getAllReports(limit, offset, status)  // Get reports with filtering
  getReportDetails(reportId)            // Get specific report
  approveReport(reportId, action)       // Approve report with action
  rejectReport(reportId)                // Reject a report
  
  // System Monitoring
  getSystemHealth()                 // Get system stats and health
  ```

#### 4. **AdminController**
- **File:** `backend/src/admin/admin.controller.ts`
- **Endpoints:**
  ```
  GET    /api/admin/users                    - List users
  GET    /api/admin/users/search?email=...   - Search users
  GET    /api/admin/users/:userId            - Get user details
  POST   /api/admin/users/:userId/block      - Block user
  POST   /api/admin/users/:userId/unblock    - Unblock user
  DELETE /api/admin/users/:userId            - Delete user
  
  GET    /api/admin/reports                     - List reports
  GET    /api/admin/reports/:reportId           - Get report details
  POST   /api/admin/reports/:reportId/approve   - Approve report
  POST   /api/admin/reports/:reportId/reject    - Reject report
  
  GET    /api/admin/health                   - System health stats
  ```

#### 5. **AdminModule**
- **File:** `backend/src/admin/admin.module.ts`
- **Exports:** AdminService for use in other modules
- **Imports:** User and Report entities via TypeORM

### Frontend Components

#### 1. **Admin Service**
- **File:** `frontend/src/app/features/admin/services/admin.service.ts`
- **Purpose:** HTTP client for communicating with backend admin API
- **Methods:** Mirror backend API endpoints

#### 2. **Admin Guard**
- **File:** `frontend/src/app/core/guards/admin.guard.ts`
- **Purpose:** Route protection for admin pages
- **Logic:** Checks if user has `admin` role before allowing navigation

#### 3. **Admin Dashboard Page**
- **File:** `frontend/src/app/features/admin/pages/admin-dashboard.page.ts/html/scss`
- **Purpose:** Main admin hub with navigation to tools
- **Features:**
  - Navigation cards for User Management, Moderation Queue, System Monitoring

#### 4. **User Management Page**
- **File:** `frontend/src/app/features/admin/pages/user-management.page.ts/html/scss`
- **Features:**
  - List all users with pagination
  - Search users by email
  - Block/unblock user accounts
  - Delete user accounts
  - Status indicators for blocked users

#### 5. **Moderation Queue Page**
- **File:** `frontend/src/app/features/admin/pages/moderation-queue.page.ts/html/scss`
- **Features:**
  - Filter reports by status (pending, resolved, rejected)
  - View report details
  - Approve reports with actions (block_user, delete_comment, warn_user)
  - Reject reports
  - Status badges for quick identification

#### 6. **System Monitoring Page**
- **File:** `frontend/src/app/features/admin/pages/system-monitoring.page.ts/html/scss`
- **Features:**
  - Database status and statistics
  - User count breakdown (total, admins)
  - Reports dashboard (total, pending)
  - WebSocket connections monitoring
  - Auto-refresh capability (5-second intervals)

### Routing

**Admin routes added to `frontend/src/app/app.routes.ts`:**
```
/admin                    - Admin Dashboard (protected by AdminGuard)
/admin/users              - User Management (protected by AdminGuard)
/admin/reports            - Moderation Queue (protected by AdminGuard)
/admin/system             - System Monitoring (protected by AdminGuard)
```

## Database Changes

### Migration: AddRoleToUsers
- **Up:** Adds `role` enum column and `blocked_at` timestamp column to `users` table
- **Down:** Removes both columns for rollback

## Security Considerations

1. **Admin Endpoints Protection:**
   - All admin endpoints use `JwtAuthGuard` for authentication
   - All admin endpoints use `AdminGuard` for authorization
   - Only users with `role = 'admin'` can access

2. **Frontend Protection:**
   - Admin routes use `AdminGuard` to prevent non-admin access
   - Routes redirect to `/home` if user lacks admin privileges

3. **User Actions:**
   - Admin users cannot block/delete other admin users
   - All sensitive actions require confirmation

## API Response Examples

### Get Users
```json
{
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "role": "user",
      "createdAt": "2025-12-20T10:00:00Z",
      "blocked_at": null
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

### Get Reports
```json
{
  "data": [
    {
      "id": 1,
      "reason": "Inappropriate content",
      "status": "pending",
      "createdAt": "2025-12-20T09:00:00Z",
      "reporterEmail": "reporter@example.com",
      "targetEmail": "reported@example.com"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

### System Health
```json
{
  "timestamp": "2025-12-20T10:30:00Z",
  "database": {
    "status": "connected",
    "users": {
      "total": 100,
      "admins": 2
    }
  },
  "reports": {
    "total": 25,
    "pending": 5
  },
  "websockets": {
    "activeConnections": 15
  }
}
```

## Testing Requirements

### Backend Tests Needed
- [ ] AdminService unit tests
- [ ] AdminController unit tests
- [ ] AdminGuard unit tests
- [ ] E2E tests for admin endpoints

### Frontend Tests Needed
- [ ] AdminService unit tests
- [ ] AdminGuard unit tests
- [ ] Admin page component tests (dashboard, user-management, moderation-queue, system-monitoring)

## Deployment Notes

1. **Database Migration Required:**
   ```bash
   npm --prefix backend run migrate:run
   ```

2. **Environment Setup:**
   - Ensure backend admin endpoints are accessible
   - Admin user role must be set in database

3. **First Admin User Setup:**
   - Manually update user role in database or create seeder:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
   ```

## Future Enhancements

1. **Advanced Analytics:**
   - Track user activity patterns
   - Generate admin reports
   - Activity logs for moderation actions

2. **Enhanced Moderation:**
   - Automatic content filtering/detection
   - Appeal process for users
   - Moderation action history/audit log

3. **User Management:**
   - Bulk user operations
   - User role management (promote/demote admins)
   - User activity history

4. **System Monitoring:**
   - Performance metrics
   - Error tracking and alerts
   - Database performance stats

## File Structure

```
backend/
├── src/
│   ├── admin/
│   │   ├── admin.controller.ts
│   │   ├── admin.module.ts
│   │   └── services/
│   │       └── admin.service.ts
│   ├── auth/
│   │   └── guards/
│   │       └── admin.guard.ts
│   └── users/
│       └── user.entity.ts (updated)
└── migrations/
    └── 1703084800000-AddRoleToUsers.ts

frontend/
└── src/
    └── app/
        ├── features/
        │   └── admin/
        │       ├── pages/
        │       │   ├── admin-dashboard.page.ts/html/scss
        │       │   ├── user-management.page.ts/html/scss
        │       │   ├── moderation-queue.page.ts/html/scss
        │       │   └── system-monitoring.page.ts/html/scss
        │       └── services/
        │           └── admin.service.ts
        └── core/
            └── guards/
                └── admin.guard.ts
```

## Commits

1. `5b18f33` - feat(admin): implement RBAC, AdminGuard, and Admin API endpoints
2. `e9e6351` - feat(admin-frontend): implement admin dashboard with user management and moderation
3. `07f605f` - fix: restore backend admin files
