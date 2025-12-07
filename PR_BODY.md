Title: Deploy Phase 2 WebSockets to Staging

Summary:
- Deploy the merged Phase 2 WebSocket feature to the staging environment for validation.
- Includes: backend `MatchGateway` (WebSocket gateway), frontend WebSocket client/service, and tests.

Changes included:
- backend: `src/websockets/match.gateway.ts`, tests and DI fixes
- backend: database password handling and CI test hardening
- frontend: WebSocket client/service and `MatchDetailsPage` improvements

Why:
- Validate WebSocket behavior in production-like infra (CORS, proxy, load balancer, and DB).
- Run smoke tests and e2e against staging to catch infra-related issues before production rollout.

How to test (Smoke):
1. Ensure staging environment is ready (containers / infra up).
2. Run DB migrations (if required): `cd backend && npm run migrate:run`.
3. Deploy the app (your usual staging deploy command / CI job).
4. Run quick health check:
   - `curl -sS https://staging.example.com/health`
5. Quick WebSocket smoke test (node):
   - `node -e "const { io } = require('socket.io-client'); const s = io('https://staging.example.com',{transports:['websocket']}); s.on('connect',()=>{console.log('connected'); s.disconnect();});"`
6. Run backend e2e tests against staging (if applicable): `cd backend && npm run test:e2e`.

Migration / Deploy notes:
- No DB schema changes expected for this release. If migrations were added, run them before starting the app.
- Ensure `DATABASE_URL` or `DB_*` env vars are set in staging.

Rollback plan:
- If critical issues are found, revert to the previous tag/commit and redeploy the previous release.
- Keep a hotfix branch ready if small fixes are required.

CI / Post-deploy checks:
- Confirm GitHub Actions on `main` are passing (unit + e2e).
- Monitor logs for socket errors and disconnect spikes for 15–30 minutes after deploy.

Reviewer suggestions:
- @alice (backend)
- @bob (frontend)

Related issues:
- Closes: #<issue-number> (if applicable)

Notes:
- This PR file is intentionally brief; detailed runbooks live in `docs/ops/` (or add here if you prefer).