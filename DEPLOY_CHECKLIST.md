# Staging Deploy Checklist: Redis Socket Adapter

## Pre-Deploy
- [ ] Confirm Redis instance is running in staging environment
- [ ] Set `REDIS_URL` environment variable (e.g., `redis://redis-staging:6379`)
- [ ] Verify main branch has the latest Redis adapter code (#45 merged)
- [ ] Run local tests: `cd backend && npm test && npm run test:e2e`

## Deploy Steps
- [ ] Tag release: `git tag v2.1.0-redis-adapter && git push origin v2.1.0-redis-adapter`
- [ ] Deploy to staging via CI/CD pipeline or manual deploy
- [ ] Wait for deployment to complete (monitor staging logs)

## Post-Deploy Verification
- [ ] Health check: `curl -s https://staging.example.com/health` returns 200
- [ ] WebSocket connection test:
  ```bash
  node -e "
  const { io } = require('socket.io-client');
  const s = io('https://staging.example.com', { transports: ['websocket'] });
  s.on('connect', () => { console.log('Connected'); s.disconnect(); });
  "
  ```
- [ ] Redis connectivity: Check app logs for "Redis adapter initialized" or similar
- [ ] Clustering test: If multiple instances, verify broadcasts work across pods
- [ ] Performance: Monitor WebSocket connection latency and error rates
- [ ] Logs: No Redis connection errors or adapter failures

## Rollback Plan
- [ ] If Redis fails: Unset `REDIS_URL` and redeploy (falls back to default adapter)
- [ ] If critical issues: Revert to previous tag/commit
- [ ] Monitor for 30 minutes post-rollback

## Notes
- Backward compatible: App works without Redis
- Next: Production rollout after staging validation
- Observability: Add Redis metrics if needed for monitoring

