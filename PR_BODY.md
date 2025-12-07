# Deploy Redis Socket Adapter to Staging

## Summary
Deploys the Redis adapter for Socket.IO clustering to staging environment. This enables horizontal scaling of WebSocket connections across multiple backend instances.

## Changes
- **Merged from main**: Redis adapter implementation (#45)
  - `@socket.io/redis-adapter` and `ioredis` dependencies
  - `RedisIoAdapter` class with conditional Redis support
  - `REDIS_URL` config validation
  - Integration in `main.ts`

## Testing
- All backend tests pass (unit + e2e)
- WebSocket functionality verified locally
- Redis adapter enables clustering when `REDIS_URL` is set

## Deployment Checklist
- [ ] Set `REDIS_URL` in staging environment (e.g., `redis://localhost:6379`)
- [ ] Ensure Redis instance is running and accessible
- [ ] Deploy to staging
- [ ] Verify health endpoint: `GET /health`
- [ ] Test WebSocket clustering: connect multiple clients, broadcast across instances
- [ ] Check logs for Redis connection and adapter initialization
- [ ] Monitor for WebSocket errors or performance issues
- [ ] Rollback plan: revert if Redis connectivity fails

## Rollback
If issues:
1. Unset `REDIS_URL` or revert deployment
2. App falls back to default adapter (no clustering)
3. Check Redis logs for connectivity issues

## Related Issues
- Part of Phase 2: Real-time WebSocket match updates
- Enables production-ready clustering