Phase 2 — Staging Deploy Checklist

Pre-deploy
- [ ] Confirm `main` branch is green and up-to-date.
- [ ] Ensure branch `feat/phase-2-staging-deploy` is created from `main` and pushed.
- [ ] Verify required secrets/envs exist for staging (DB credentials, websocket URL, API keys).
- [ ] Snapshot or tag current staging deployment (for quick rollback).

Deploy
- [ ] Run DB migrations (if any): `cd backend && npm run migrate:run`.
- [ ] Deploy backend service(s) and frontend (via CI or deploy script).
- [ ] Ensure process manager / containers restarted and healthy.

Smoke tests (immediate)
- [ ] Health endpoint: `curl -sS https://staging.example.com/health` -> HTTP 200
- [ ] API sanity: request a known endpoint (e.g., `GET /api/matches/:id`).
- [ ] Socket connect: connect a client to the WebSocket endpoint and verify `connect` event.
- [ ] Subscribe flow: subscribe to a test-match and confirm `match-update` initial message is received.
- [ ] Unsubscribe flow: unsubscribe and confirm no further messages for that match.

Full test
- [ ] Run backend e2e tests against staging: `cd backend && npm run test:e2e`.
- [ ] Run frontend build + smoke tests: `cd frontend && npm run build && npm run test:smoke` (if available).

Post-deploy monitoring
- [ ] Watch logs for 15-30 minutes; look for errors in WebSocket gateway, reconnect floods, auth failures.
- [ ] Check metrics: active socket connections, subscribe/unsubscribe rates, message broadcast rate.
- [ ] Verify no memory or CPU spikes across instances.

Rollback criteria
- [ ] Critical application errors preventing API use or socket floods.
- [ ] Repeated failing health checks or timeouts in smoke tests.

Rollback steps
- [ ] Trigger rollback to previous tag/commit and restart services.
- [ ] Re-run smoke tests to confirm restored state.

Postmortem
- [ ] If issues required rollback, open a postmortem with root cause and actions.

Notes
- Adjust hostnames, ports and commands to match your staging infra.
- For high-scale test, use load-test scripts (k6 / Artillery) to simulate concurrent sockets.

Contacts
- Backend: @alice
- Frontend: @bob
- DevOps: @devops

