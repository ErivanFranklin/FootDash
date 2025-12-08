# Phase 2 Push Notifications Launch

## Summary
Implement Firebase Cloud Messaging support so FootDash can notify users about live match events even when the app runs in the background.

## Changes
- Added `firebase-admin` plus `NotificationsModule` with token registration endpoint and persistence
- Introduced `NotificationToken` entity and `FCM_*` configuration validation so secrets are injected safely
- Enabled `MatchesService` to detect match start, goal, and final-score transitions and publish push notifications to every registered device token
- Updated `matches.service.spec.ts` and the matches e2e fixture test so the notification service is mocked and the config module is available

## Testing
- `npm test`
- `npm run test:e2e`

## Deployment Checklist
- [ ] Provide `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, and `FCM_PRIVATE_KEY` in staging
- [ ] Ensure Redis-backed Socket.IO Redis adapter (Phase 2 #45) is still deployed
- [ ] Deploy backend and make sure migrations are applied
- [ ] Verify `/health` endpoint returns 200
- [ ] Use a device/emulator to register a push token via `POST /notifications/tokens`
- [ ] Trigger `POST /matches/team/:teamId/sync` and verify FCM logs show messages being sent
- [ ] Confirm notifications arrive for match start, goals, and final score events
- [ ] Monitor logs for Firebase errors (missing/invalid tokens, auth failures)
- [ ] Rollback plan: unset FCM environment variables and redeploy if push delivery breaks