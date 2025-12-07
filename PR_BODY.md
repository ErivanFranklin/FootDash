# Redis Socket Adapter for Clustering

## Summary
Adds Redis adapter to Socket.IO for horizontal scaling and clustering support. This enables WebSocket connections to be shared across multiple backend instances, ensuring real-time match updates work in a load-balanced environment.

## Changes
- **Dependencies**: Added `@socket.io/redis-adapter` and `ioredis` for Redis connectivity
- **Configuration**: Added `REDIS_URL` environment variable validation
- **Adapter Implementation**: Created `RedisIoAdapter` class that conditionally uses Redis adapter when `REDIS_URL` is provided
- **Integration**: Wired the adapter in `main.ts` for automatic clustering when Redis is available

## Testing
- All existing unit and e2e tests pass
- WebSocket functionality remains unchanged when Redis is not configured
- Adapter enables clustering when `REDIS_URL` is set (e.g., `redis://localhost:6379`)

## Deployment Notes
- **Environment**: Add `REDIS_URL` to staging/production environments
- **Redis Setup**: Ensure Redis instance is available and accessible
- **Backward Compatibility**: Works without Redis (falls back to default adapter)
- **Scaling**: Allows multiple backend pods to share WebSocket connections

## Checklist
- [x] Dependencies installed and committed
- [x] Configuration updated
- [x] Adapter implemented and integrated
- [x] Tests pass locally
- [x] Code reviewed for security/best practices
- [x] Documentation updated (README if needed)

## Related Issues
- Part of Phase 2: Real-time WebSocket match updates
- Enables production-ready clustering for WebSocket broadcasts