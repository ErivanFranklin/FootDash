# Backend scripts

This folder contains utility scripts used during development and local testing.

send-test-notification.ts
- Purpose: Boot a Nest application context and invoke `NotificationsService.sendMatchNotice(...)` to force a push notification for testing.
- Usage (recommended via `ts-node` during development):

```bash
# Register a token, send, then remove it from the DB
node -r ts-node/register backend/scripts/send-test-notification.ts --token "<FCM_TOKEN>" --cleanup

# Send without registering (useful if token already exists in DB)
node -r ts-node/register backend/scripts/send-test-notification.ts --token "<FCM_TOKEN>" --no-register

# Provide custom summary or match id
node -r ts-node/register backend/scripts/send-test-notification.ts --token "<FCM_TOKEN>" --summary "Hello" --match-id 1234
```

Flags
- `--token <token>`: (optional) FCM token to include for the test. If not provided, the script reads `SMOKE_TEST_TOKEN` from environment.
- `--no-register`: do not attempt to register the token before sending (useful if the token is already in DB).
- `--cleanup`: after sending, delete the token from `notification_tokens` table (only recommended for disposable tokens used in testing).
- `--summary <text>`: optional notification body text.
- `--match-id <id>`: optional match id to include in `data.matchId`.

Safety notes
- Running this script will interact with your local database and (optionally) your Firebase project. Make sure you are running against a development/staging Firebase project before sending real push notifications.
- The `--cleanup` flag removes the exact token string from the `notification_tokens` table. Do not use it with production tokens you intend to keep.
- Avoid committing real tokens or service-account credentials into the repo. Keep credentials in environment variables or a secure vault.

Other scripts
- Deprecated helpers were moved into `backend/scripts/_deprecated/`. Check there if you need older one-off utilities; prefer the consolidated `send-test-notification.ts` for testing pushes.
