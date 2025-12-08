# Staging Deploy Checklist: Push Notifications

## Pre-Deploy
- [ ] Confirm Firebase project credentials are ready (`FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`)
- [ ] Ensure the Redis Socket.IO adapter rollout (#45) remains live in staging
- [ ] Run backend tests locally: `cd backend && npm test && npm run test:e2e`
- [ ] Identify one or more devices/emulators that can register push tokens

## Deploy Steps
- [ ] Deploy backend with the new branch/commit that includes push notification logic
- [ ] Wait for staging services to be healthy (watch logs for startup errors)

## Post-Deploy Verification
- [ ] Health endpoint: `curl -s https://staging.example.com/health` returns 200
- [ ] Register a token via `POST /notifications/tokens` (use staging-safe value for `token`)
- [ ] Trigger `POST /matches/team/:teamId/sync` and confirm Firebase logs show notifications are sent
- [ ] Verify at least one registered device receives notifications for match start, goals, and final score
- [ ] Check server logs for any Firebase authentication or token-binding errors
- [ ] Review metrics for WebSocket stability (no regressions from Redis adapter)

## Rollback Plan
- [ ] Unset `FCM_*` env vars and redeploy if Firebase errors prevent message delivery
- [ ] If critical, revert to the previous tag/commit and restart staging services
- [ ] Monitor for 30 minutes post-rollback for signal/API errors

## Notes
- The app already falls back to the default adapter when push credentials are missing
- This rollout depends on the Redis clustering work in #45 as its foundation
- Collect Firebase debug logs if there are delivery failures

