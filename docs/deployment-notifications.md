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

GitHub Actions (recommended)

- Add these repository (or environment) secrets under **Settings → Secrets and variables → Actions**:
	- `FCM_PROJECT_ID`
	- `FCM_CLIENT_EMAIL`
	- `FCM_PRIVATE_KEY` (paste the private key with newlines quoted as `\\n` or as a single-line string containing `\n` escapes)
	- `MONITORING_WEBHOOK_URL` (optional)

- When you add these as secrets, workflows can map them into the job environment. Example (already used by the repository e2e workflow):

```yaml
env:
	FCM_PROJECT_ID: ${{ secrets.FCM_PROJECT_ID }}
	FCM_CLIENT_EMAIL: ${{ secrets.FCM_CLIENT_EMAIL }}
	FCM_PRIVATE_KEY: ${{ secrets.FCM_PRIVATE_KEY }}
	MONITORING_WEBHOOK_URL: ${{ secrets.MONITORING_WEBHOOK_URL }}
```

- Prefer storing these secrets at the environment level (e.g., `staging`, `production`) so you can require approvals for deployments to sensitive environments.

Notes on `FCM_PRIVATE_KEY`

- Most CI/Secrets UI fields expect a single-line secret; replace literal newlines with `\\n` when adding the key. At runtime the app will read the string and the underlying Firebase client accepts `\\n`-escaped private key values.

Webhook payload (when failures occur)

- When multicast sends report failures (> 0), the backend posts a JSON summary to `MONITORING_WEBHOOK_URL` with this shape:

```json
{
	"project": "<FCM_PROJECT_ID|null>",
	"event": "notifications.multicast.failed",
	"successCount": 5,
	"failureCount": 2,
	"failed": [
		{ "token": "<partial>", "error": "InvalidRegistration" },
		{ "token": "<partial>", "error": "NotRegistered" }
	],
	"timestamp": "2025-12-09T12:34:56.789Z"
}
```

If you do not set `MONITORING_WEBHOOK_URL`, the backend will only log the summary locally.

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
