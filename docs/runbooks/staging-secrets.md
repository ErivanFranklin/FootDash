# Runbook: Creating a `staging` environment and adding secrets

This runbook explains how to create a GitHub `staging` environment for FootDash and add the FCM and monitoring secrets safely.

1) Create the `staging` environment

- Open your repository on GitHub → `Settings` → `Environments` → `New environment`.
- Name the environment `staging`.

2) Add environment secrets

- In the `staging` environment page, click `Add secret` and create the following secrets:
  - `FCM_PROJECT_ID` (string)
  - `FCM_CLIENT_EMAIL` (string)
  - `FCM_PRIVATE_KEY` (the full private key from your Firebase service account). When pasting, replace literal newlines with `\\n` so CI systems keep the key as a single-line secret.
  - `MONITORING_WEBHOOK_URL` (optional) — the HTTP endpoint to receive notification failure payloads

Notes on `FCM_PRIVATE_KEY`:

- Many secret UIs do not accept multi-line values. Convert newlines to the two-character escape sequence `\\n` when adding the secret. At runtime the app expects this escaped form and firebase initialization accepts it.

3) Protect the environment (recommended)

- On the `staging` environment page, add protection rules (optional) such as required reviewers for deployments, approval timeouts, and job restrictions. This prevents accidental runs against staging.

4) Test the configuration with the example workflow

- Use the example workflow in `.github/workflows/example-staging-env.yml`. From the Actions tab, choose `Example Staging Deploy (Secrets + Environment)` and click `Run workflow`.
- The job will run in the `staging` environment and the example step will echo sanitized presence of secrets (it will not print the private key).

5) Verification

- Check the Actions job logs for the sanity check step to confirm `FCM_PROJECT_ID` and `FCM_CLIENT_EMAIL` are present (it will show `<missing>` if not provided) and whether `MONITORING_WEBHOOK_URL` is set.
- Deploy a test build or run the staging smoke test to fully validate end-to-end notifications (requires a valid FCM web token).

6) Rollback & disabling

- To disable notifications in staging, remove the FCM secrets from the `staging` environment or set them to empty values; restart the service if needed.

Security notes

- Prefer environment-level secrets for staging/production instead of repository-wide secrets so you can require approvals for environment deployments.
- Never echo `FCM_PRIVATE_KEY` in logs. Keep the key secret and rotate it if accidentally exposed.
