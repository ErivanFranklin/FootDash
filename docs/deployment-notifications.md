# Deployment checklist — Notifications (FCM)

This document lists the required secrets, environment variables, and steps to deploy the Firebase Cloud Messaging (FCM) integration safely.

Required environment variables (server-side)

- `FCM_PROJECT_ID` — Firebase project ID (string)
- `FCM_CLIENT_EMAIL` — Service account client email
- `FCM_PRIVATE_KEY` — Service account private key (escape newlines as `\\n` when storing in env)
- `MONITORING_WEBHOOK_URL` (optional) — HTTP endpoint to receive notification failure events (POST JSON). If not set, events are only logged.
- `NOTIFICATIONS_DEBUG` (optional) — Set to `true` to enable verbose token/response debug logging.

Database

- The app stores registered device tokens in `notification_tokens`. Ensure the database migrations have been applied before enabling notifications:

```bash
cd backend
npm run migrate:run
```

Secrets management

- Store the service account values in your secret manager (GitHub Secrets, AWS Secrets Manager, GCP Secret Manager, Vault). Do NOT commit them to the repository or store them in plaintext `.env` in source control.
- In GitHub Actions, map the secret values into the workflow environment as `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`.

Staging verification steps

1. Ensure staging environment has the FCM service account envs above.
2. Deploy or start the backend in staging.
3. Check logs for `Firebase initialized for push notifications` and/or `Push notification skipped because Firebase is not configured` to verify initialization.
4. Run a staged smoke test (requires a test device token):

```bash
# interactive script (register -> send -> optional cleanup)
SMOKE_TEST_TOKEN="<STAGING_FCM_TOKEN>" node -r ts-node/register backend/scripts/send-test-notification.ts --cleanup
```

Monitoring

- If you configure `MONITORING_WEBHOOK_URL`, the backend will POST a summary object when multicast sends have failures. Configure your monitoring system (Sentry, Datadog, Slack webhook) to accept these payloads and alert on spikes.

Rollback plan

- If notifications cause an issue, disable by removing the FCM envs (or set `FCM_PROJECT_ID`/`FCM_CLIENT_EMAIL`/`FCM_PRIVATE_KEY` to empty) and restart the backend.

Operational notes

- The server removes invalid tokens discovered during sends. We also provide a scheduled cleanup script to remove obviously malformed tokens (short tokens, placeholders).
- Keep `NOTIFICATIONS_DEBUG` off in production unless actively debugging.
