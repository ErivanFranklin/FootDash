# Priority 5: Social Features - Implementation Plan

## Overview
Implement social interaction features to enable users to discuss matches, share predictions, and engage with the FootDash community. This builds on the existing analytics and real-time features to create a complete social experience around football.

**Branch:** `feature/social-features`  
**Estimated Duration:** 2-3 weeks  
**Start Date:** December 10, 2025

---

## Goals

1. **Community Engagement** - Enable users to discuss matches and predictions
2. **Social Interaction** - Comments, reactions, and user connections
3. **Content Discovery** - Social feed with relevant discussions
4. **Real-time Updates** - Instant notifications for social interactions
5. **Moderation** - Basic content filtering and reporting

---

## Architecture Overview

### Backend (NestJS)
```
backend/src/social/
├── entities/
│   ├── comment.entity.ts          # Match/prediction comments
│   ├── reaction.entity.ts         # Likes, reactions to content
│   ├── follow.entity.ts           # User follow relationships
│   └── user-activity.entity.ts    # Activity feed events
├── dto/
│   ├── create-comment.dto.ts
│   ├── reaction.dto.ts
│   └── follow.dto.ts
├── services/
│   ├── comments.service.ts        # Comment CRUD operations
│   ├── reactions.service.ts       # Reaction management
│   ├── follow.service.ts          # Follow/unfollow logic
│   └── feed.service.ts            # Activity feed generation
├── controllers/
│   ├── comments.controller.ts
│   ├── reactions.controller.ts
│   ├── follow.controller.ts
│   └── feed.controller.ts
├── gateways/
│   └── social.gateway.ts          # WebSocket for real-time updates
└── social.module.ts
```

### Frontend (Angular/Ionic)
```
frontend/src/app/
├── models/
│   └── social.model.ts            # TypeScript interfaces
├── services/
│   └── social.service.ts          # HTTP + WebSocket client
├── components/
│   ├── comment-list/              # Display comments
│   ├── comment-form/              # Create/edit comments
│   ├── reaction-button/           # Like/reaction button
│   ├── user-badge/                # Mini user profile display
│   └── activity-feed/             # Social feed list
└── features/social/pages/
    ├── feed.page/                 # Main social feed
    ├── user-profile.page/         # User's public profile
    └── followers.page/            # Followers/following lists
```

---

## Phase 1: Backend Foundation (Week 1, Days 1-3)

### 1.1 Database Schema

#### Comments Table
```typescript
interface Comment {
  id: number;
  userId: number;
  matchId?: number;          // Optional: comment on match
  predictionId?: number;     // Optional: comment on prediction
  parentCommentId?: number;  // Optional: reply to comment
  content: string;           // Max 500 chars
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}
```

#### Reactions Table
```typescript
interface Reaction {
  id: number;
  userId: number;
  targetType: 'comment' | 'prediction' | 'match';
  targetId: number;
  reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: Date;
}
// Unique constraint: (userId, targetType, targetId)
```

#### Follows Table
```typescript
interface Follow {
  id: number;
  followerId: number;        // User who follows
  followingId: number;       // User being followed
  createdAt: Date;
}
// Unique constraint: (followerId, followingId)
```

#### User Activity Table
```typescript
interface UserActivity {
  id: number;
  userId: number;
  activityType: 'comment' | 'reaction' | 'prediction' | 'follow';
  targetType: 'match' | 'prediction' | 'comment' | 'user';
  targetId: number;
  metadata?: any;            // JSON field for additional data
  createdAt: Date;
}
```

### 1.2 Migration Script
**File:** `backend/migrations/[timestamp]-CreateSocialTables.ts`

```typescript
// Create tables: comments, reactions, follows, user_activity
// Add indexes: userId, matchId, predictionId, createdAt
// Add foreign keys to users, matches, match_predictions
```

### 1.3 Entities & DTOs
- Create TypeORM entities with relations
- Validation DTOs with class-validator
- Response DTOs for API serialization

### 1.4 Services Implementation

#### CommentsService
```typescript
- createComment(userId, dto): Comment
- getCommentsByMatch(matchId, pagination): Comment[]
- getCommentsByPrediction(predictionId, pagination): Comment[]
- getReplies(parentCommentId, pagination): Comment[]
- updateComment(commentId, userId, content): Comment
- deleteComment(commentId, userId): boolean
- getCommentCount(targetType, targetId): number
```

#### ReactionsService
```typescript
- addReaction(userId, targetType, targetId, reactionType): Reaction
- removeReaction(userId, targetType, targetId): boolean
- getReactionsByTarget(targetType, targetId): ReactionSummary
- getUserReaction(userId, targetType, targetId): Reaction | null
- getReactionCount(targetType, targetId): { [key: string]: number }
```

#### FollowService
```typescript
- followUser(followerId, followingId): Follow
- unfollowUser(followerId, followingId): boolean
- getFollowers(userId, pagination): User[]
- getFollowing(userId, pagination): User[]
- getFollowerCount(userId): number
- getFollowingCount(userId): number
- isFollowing(followerId, followingId): boolean
```

#### FeedService
```typescript
- getUserFeed(userId, pagination): Activity[]
- getGlobalFeed(pagination): Activity[]
- getMatchFeed(matchId, pagination): Activity[]
- addActivity(userId, type, targetType, targetId, metadata): Activity
```

### 1.5 Controllers & Endpoints

#### CommentsController (`/api/comments`)
- `POST /` - Create comment (auth required)
- `GET /match/:matchId` - Get match comments
- `GET /prediction/:predictionId` - Get prediction comments
- `GET /:commentId/replies` - Get comment replies
- `PUT /:commentId` - Update comment (owner only)
- `DELETE /:commentId` - Delete comment (owner only)

#### ReactionsController (`/api/reactions`)
- `POST /` - Add/change reaction (auth required)
- `DELETE /:targetType/:targetId` - Remove reaction
- `GET /:targetType/:targetId` - Get reaction summary
- `GET /user/:targetType/:targetId` - Get user's reaction

#### FollowController (`/api/follow`)
- `POST /` - Follow user (auth required)
- `DELETE /:userId` - Unfollow user
- `GET /followers/:userId` - Get followers list
- `GET /following/:userId` - Get following list
- `GET /stats/:userId` - Get follower/following counts

#### FeedController (`/api/feed`)
- `GET /` - Get personalized feed (auth required)
- `GET /global` - Get global feed (public)
- `GET /match/:matchId` - Get match-specific feed
- `GET /user/:userId` - Get user's activity

### 1.6 WebSocket Gateway
**File:** `backend/src/social/gateways/social.gateway.ts`

```typescript
Events:
- 'comment-added' → Emit to match/prediction room
- 'reaction-added' → Emit to content owner
- 'new-follower' → Emit to followed user
- 'comment-reply' → Emit to parent comment author

Rooms:
- 'match:{matchId}' → All users viewing a match
- 'user:{userId}' → User's personal notifications
```

---

## Phase 2: Frontend Implementation (Week 1-2, Days 4-7)

### 2.1 Models & Services

#### Social Models
**File:** `frontend/src/app/models/social.model.ts`

```typescript
export interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  matchId?: number;
  predictionId?: number;
  parentCommentId?: number;
  content: string;
  replyCount: number;
  reactionCount: number;
  userReaction?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reaction {
  id: number;
  userId: number;
  targetType: 'comment' | 'prediction' | 'match';
  targetId: number;
  reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: string;
}

export interface ReactionSummary {
  like: number;
  love: number;
  laugh: number;
  wow: number;
  sad: number;
  angry: number;
  total: number;
  userReaction?: string;
}

export interface Follow {
  followerId: number;
  followingId: number;
  followerName?: string;
  followingName?: string;
  createdAt: string;
}

export interface Activity {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  activityType: 'comment' | 'reaction' | 'prediction' | 'follow';
  targetType: 'match' | 'prediction' | 'comment' | 'user';
  targetId: number;
  targetName?: string;
  content?: string;
  createdAt: string;
}
```

#### Social Service
**File:** `frontend/src/app/services/social.service.ts`

```typescript
Methods:
- Comments:
  - getMatchComments(matchId, page): Observable<Comment[]>
  - getPredictionComments(predictionId, page): Observable<Comment[]>
  - getCommentReplies(commentId, page): Observable<Comment[]>
  - createComment(dto): Observable<Comment>
  - updateComment(id, content): Observable<Comment>
  - deleteComment(id): Observable<void>

- Reactions:
  - addReaction(targetType, targetId, type): Observable<Reaction>
  - removeReaction(targetType, targetId): Observable<void>
  - getReactionSummary(targetType, targetId): Observable<ReactionSummary>

- Follow:
  - followUser(userId): Observable<Follow>
  - unfollowUser(userId): Observable<void>
  - getFollowers(userId, page): Observable<User[]>
  - getFollowing(userId, page): Observable<User[]>
  - getFollowStats(userId): Observable<{followers: number, following: number}>

- Feed:
  - getFeed(page): Observable<Activity[]>
  - getGlobalFeed(page): Observable<Activity[]>
  - getMatchFeed(matchId, page): Observable<Activity[]>
  - getUserFeed(userId, page): Observable<Activity[]>

- WebSocket:
  - connectToMatch(matchId): void
  - disconnectFromMatch(matchId): void
  - onNewComment(): Observable<Comment>
  - onNewReaction(): Observable<Reaction>
  - onNewFollower(): Observable<Follow>
```

### 2.2 Shared Components

#### CommentListComponent
**File:** `frontend/src/app/components/comment-list/`

```typescript
Features:
- Display list of comments with user info
- Reply threading (show/hide replies)
- Reaction summary on each comment
- Time ago formatting
- Infinite scroll pagination
- Empty state ("No comments yet")
- Skeleton loading

Inputs:
- @Input() targetType: 'match' | 'prediction'
- @Input() targetId: number
- @Input() maxDepth: number = 2

UI:
- User avatar + name
- Comment content
- Time ago ("2 minutes ago")
- Reaction bar (like, love, etc.)
- Reply button → expand reply form
- Edit/delete (owner only)
```

#### CommentFormComponent
**File:** `frontend/src/app/components/comment-form/`

```typescript
Features:
- Textarea with character counter (0/500)
- Submit button
- Auto-grow textarea
- Mentions support (@username)
- Emoji picker (optional)

Inputs:
- @Input() targetType: 'match' | 'prediction' | 'comment'
- @Input() targetId: number
- @Input() placeholder: string = 'Add a comment...'
- @Output() commentCreated: EventEmitter<Comment>

UI:
- IonTextarea with maxlength="500"
- Character counter
- Submit button (disabled if empty)
- Cancel button (for replies)
```

#### ReactionButtonComponent
**File:** `frontend/src/app/components/reaction-button/`

```typescript
Features:
- Icon button with reaction count
- Popover with reaction types on long-press
- Toggle user's reaction
- Optimistic UI updates
- Animation on reaction change

Inputs:
- @Input() targetType: 'comment' | 'prediction' | 'match'
- @Input() targetId: number
- @Input() initialSummary: ReactionSummary

UI:
- Primary button: "👍 42" (or current user reaction)
- Popover: All reaction types in a grid
- Active state when user has reacted
```

#### UserBadgeComponent
**File:** `frontend/src/app/components/user-badge/`

```typescript
Features:
- Mini profile display
- Avatar + name
- Follow button
- Link to user profile
- Online status indicator (optional)

Inputs:
- @Input() userId: number
- @Input() userName: string
- @Input() userAvatar?: string
- @Input() showFollowButton: boolean = true

UI:
- Avatar (circle, 40x40px)
- Name (truncate if too long)
- Follow/Following button
- Click → navigate to user profile
```

#### ActivityFeedComponent
**File:** `frontend/src/app/components/activity-feed/`

```typescript
Features:
- List of recent activities
- Different templates per activity type
- Relative timestamps
- Link to activity target
- Infinite scroll

Inputs:
- @Input() feedType: 'user' | 'global' | 'following'
- @Input() userId?: number

Templates:
- Comment: "UserA commented on Match X"
- Reaction: "UserB liked your prediction"
- Prediction: "UserC predicted Arsenal to win"
- Follow: "UserD started following you"
```

### 2.3 Feature Pages

#### FeedPage
**Route:** `/social/feed`

```typescript
Features:
- Tab navigation: "Following" | "Global"
- Activity feed list
- Pull-to-refresh
- Infinite scroll
- Empty state for new users

UI:
- IonSegment for tabs
- ActivityFeedComponent
- FloatingActionButton → Create post (future)
```

#### UserProfilePage
**Route:** `/social/profile/:userId`

```typescript
Features:
- User info (avatar, name, bio)
- Follow/Unfollow button
- Follower/Following counts
- User's recent activity
- User's recent comments
- User's predictions accuracy

UI:
- Profile header with stats
- Segment: "Activity" | "Comments" | "Predictions"
- Lists with pagination
```

#### FollowersPage
**Route:** `/social/followers/:userId` or `/social/following/:userId`

```typescript
Features:
- List of followers/following
- Search/filter users
- Follow/Unfollow buttons
- User badges with avatars

UI:
- Search bar at top
- User list with UserBadgeComponent
- Empty state
```

### 2.4 Integration with Existing Pages

#### Match Details Page
Add comments section at bottom:
```html
<section class="comments-section">
  <h2>Discussion</h2>
  <app-comment-form 
    targetType="match" 
    [targetId]="matchId"
    (commentCreated)="onCommentCreated($event)">
  </app-comment-form>
  
  <app-comment-list 
    targetType="match" 
    [targetId]="matchId">
  </app-comment-list>
</section>
```

#### Match Prediction Page
Add comments section:
```html
<section class="prediction-discussion">
  <h3>What do you think?</h3>
  <app-comment-form 
    targetType="prediction" 
    [targetId]="predictionId">
  </app-comment-form>
  
  <app-comment-list 
    targetType="prediction" 
    [targetId]="predictionId">
  </app-comment-list>
</section>
```

#### Navigation Menu
Add social links:
```html
<ion-item routerLink="/social/feed">
  <ion-icon name="people-outline" slot="start"></ion-icon>
  <ion-label>Social Feed</ion-label>
</ion-item>
```

---

## Phase 3: Real-time Features (Week 2, Days 8-10)

### 3.1 WebSocket Integration
- Connect to social gateway on app init
- Subscribe to personal notification channel
- Auto-subscribe to match rooms when viewing matches
- Handle reconnection logic

### 3.2 Live Comment Updates
- New comments appear in real-time
- Reply notifications
- Reaction count updates

### 3.3 Push Notifications
- Extend existing NotificationsService
- New notification types:
  - "UserA commented on your prediction"
  - "UserB replied to your comment"
  - "UserC started following you"
  - "UserD liked your comment"

### 3.4 Optimistic UI
- Instant feedback when creating comments
- Rollback on error
- Loading states

---

## Phase 4: Content Moderation (Week 3, Days 11-14)

### 4.1 Basic Moderation

#### Report System
```typescript
interface Report {
  id: number;
  reporterId: number;
  targetType: 'comment' | 'user';
  targetId: number;
  reason: 'spam' | 'offensive' | 'harassment' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}
```

#### Backend Endpoints
- `POST /api/reports` - Submit report
- `GET /api/reports` - List reports (admin only)
- `PUT /api/reports/:id/resolve` - Resolve report (admin only)

#### Frontend
- Add "Report" option to comment menu
- Report modal with reason selection
- Admin report review interface (in admin dashboard)

### 4.2 Content Filtering
- Profanity filter for comments (basic)
- Rate limiting: Max 10 comments per minute
- Spam detection: Duplicate content check
- Auto-flag comments with external links

### 4.3 User Blocking
```typescript
interface Block {
  id: number;
  blockerId: number;
  blockedId: number;
  createdAt: Date;
}
```

- `POST /api/blocks` - Block user
- `DELETE /api/blocks/:userId` - Unblock user
- Blocked users' comments are hidden
- Blocked users cannot follow

---

## Testing Strategy

### Backend Tests
- Unit tests for services (Jest)
- E2E tests for API endpoints
- WebSocket event tests
- Load testing for feed generation

### Frontend Tests
- Component unit tests (Karma/Jest)
- E2E tests for user flows (Playwright)
- Accessibility tests
- Performance tests (Lighthouse)

### Test Scenarios
1. Create comment → appears in list
2. Reply to comment → nested properly
3. Add reaction → count updates
4. Follow user → appears in followers list
5. Real-time comment → WebSocket delivery
6. Report comment → admin review
7. Block user → content hidden

---

## Security & Privacy

### Authentication
- All write operations require JWT
- User can only edit/delete own content
- Admin role for moderation actions

### Data Validation
- Content length limits (500 chars)
- SQL injection prevention (TypeORM)
- XSS prevention (Angular sanitization)
- Rate limiting on endpoints

### Privacy Controls
- Private profiles (future)
- Hide follower list option (future)
- Notification preferences
- Block list is private

---

## Performance Considerations

### Database Optimization
- Indexes on: userId, matchId, createdAt
- Composite index: (targetType, targetId)
- Pagination: cursor-based for feeds
- Denormalization: cache reaction counts

### Caching Strategy
- Redis cache for hot content
- Feed cache: 5 minutes
- Reaction summary cache: 1 minute
- Follower count cache: 10 minutes

### Scalability
- Connection pooling for database
- WebSocket horizontal scaling (Redis adapter)
- CDN for user avatars
- Background jobs for feed generation

---

## UI/UX Design

### Design System
- Use existing Ionic components
- Match FootDash color scheme
- Consistent spacing and typography
- Dark mode support

### Interaction Patterns
- Pull-to-refresh on feeds
- Infinite scroll (load 20 items at a time)
- Skeleton loaders during fetch
- Toast notifications for actions
- Swipe actions on comments (delete, reply)

### Accessibility
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Color contrast compliance

---

## Deployment Checklist

### Backend
- [ ] Run migration for social tables
- [ ] Configure WebSocket CORS
- [ ] Set up Redis for caching (optional)
- [ ] Configure rate limiting
- [ ] Update environment variables

### Frontend
- [ ] Add social routes to app.routes.ts
- [ ] Update navigation menu
- [ ] Configure WebSocket URL
- [ ] Test on mobile devices
- [ ] Update PWA manifest

### DevOps
- [ ] Database backups
- [ ] Monitoring for social endpoints
- [ ] Alerts for high error rates
- [ ] CDN configuration for avatars

---

## Success Metrics

### Engagement Metrics
- Comments per match: Target 10+
- Daily active users: +20%
- Average session duration: +40%
- User retention: +15%

### Technical Metrics
- API response time: < 200ms (p95)
- WebSocket latency: < 100ms
- Comment creation success rate: > 99%
- Database query time: < 50ms

### User Satisfaction
- Feature adoption rate: > 60%
- User feedback score: 4+ stars
- Support tickets: < 1% of users

---

## Future Enhancements (Phase 3+)

### Content Features
- Rich text formatting (bold, italic, links)
- Image attachments in comments
- GIF integration (Giphy API)
- Voice notes
- Polls for match predictions

### Advanced Social
- Private messaging (DMs)
- Group chats for teams/leagues
- User reputation system (karma points)
- Verified user badges
- Premium features (highlighted comments)

### Discovery
- Trending discussions
- Popular users to follow
- Suggested follows based on interests
- Hashtag support

### Gamification
- Achievements (100 comments, 1000 likes)
- Leaderboards (most active users)
- Badges for prediction accuracy
- Streak tracking (daily activity)

---

## Timeline Summary

### Week 1
- Days 1-3: Backend (entities, services, controllers)
- Days 4-7: Frontend (models, services, components)

### Week 2
- Days 8-10: Real-time features (WebSocket, push notifications)
- Days 11-12: Integration with existing pages

### Week 3
- Days 13-14: Moderation features
- Days 15-16: Testing and bug fixes
- Day 17: Documentation and deployment

---

## Conclusion

This social features implementation will transform FootDash from an information platform into a vibrant community. By enabling users to discuss matches, share predictions, and connect with fellow fans, we create a sticky, engaging experience that drives retention and growth.

The modular architecture allows for incremental development and easy extension with advanced features in the future. The foundation we build now will support rich social interactions for years to come.

**Next Step:** Create feature branch and begin Phase 1 implementation.
