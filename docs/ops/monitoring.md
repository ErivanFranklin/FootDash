# Monitoring & Observability (Phase 1)

This runbook covers monitoring setup for the FootDash application, including health checks, logging, error tracking, and alerting.

## Health Checks

### Application Health Endpoints

#### GET /health
Basic health check endpoint that verifies:
- Application is running
- Database connectivity
- Basic service dependencies

Response (200):
```json
{
  "status": "ok",
  "timestamp": "2025-11-05T10:30:00Z",
  "version": "1.0.0",
  "uptime": 3600
}
```

#### GET /health/detailed
Detailed health check including:
- Database connection status
- External API connectivity (football data providers)
- Cache/redis status (if applicable)
- Queue health (if applicable)

Response (200):
```json
{
  "status": "ok",
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 45
    },
    "football-api": {
      "status": "ok",
      "responseTime": 120
    }
  }
}
```

### Database Health Checks

```sql
-- Basic connectivity check
SELECT 1;

-- Connection pool status (if using connection pooling)
SELECT count(*) as active_connections FROM pg_stat_activity;

-- Table existence and basic data integrity
SELECT count(*) FROM users;
SELECT count(*) FROM teams;
SELECT count(*) FROM matches;
```

### Infrastructure Health Checks

#### Docker Container Health
```yaml
# In docker-compose.yml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

#### Kubernetes Health Checks (Future)
- Readiness probe: `/health/ready`
- Liveness probe: `/health/live`
- Startup probe: `/health/startup`

## Logging

### Application Logging

#### Log Levels
- **ERROR**: Application errors, exceptions, database failures
- **WARN**: Potentially harmful situations, deprecated API usage
- **INFO**: Important business logic events (user registration, match creation)
- **DEBUG**: Detailed debugging information (development only)

#### Structured Logging Format
```json
{
  "timestamp": "2025-11-05T10:30:00Z",
  "level": "INFO",
  "service": "footdash-api",
  "requestId": "req-12345",
  "userId": "user-67890",
  "message": "User registered successfully",
  "metadata": {
    "email": "user@example.com",
    "ip": "192.168.1.1"
  }
}
```

#### Key Log Events
- Authentication events (login, logout, token refresh)
- API requests (method, path, status code, response time)
- Database operations (slow queries, connection issues)
- External API calls (football data provider requests)
- Background job execution (if applicable)

### Infrastructure Logging

#### Container Logs
```bash
# View application logs
docker logs footdash-backend

# Follow logs in real-time
docker logs -f footdash-backend

# View logs with timestamps
docker logs --timestamps footdash-backend
```

#### Database Logs
```sql
-- Enable query logging in PostgreSQL
ALTER DATABASE footdash SET log_statement = 'all';
ALTER DATABASE footdash SET log_duration = 'on';

-- View slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

## Error Tracking & Alerting

### Error Monitoring

#### Sentry Integration (Recommended)
```typescript
// In main.ts (NestJS)
import * as Sentry from '@sentry/nestjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Error boundary for unhandled exceptions
process.on('uncaughtException', (error) => {
  Sentry.captureException(error);
  process.exit(1);
});
```

#### Custom Error Tracking
Log all errors with context:
```typescript
logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  userId: request.user?.id,
  requestId: request.id,
  url: request.url,
  method: request.method
});
```

### Alerting Setup

#### Application Alerts
- **High Error Rate**: >5% of requests return 5xx errors in 5 minutes
- **Slow Response Time**: P95 response time >2 seconds for 5 minutes
- **Database Connection Issues**: >10% connection failures in 1 minute
- **High Memory Usage**: >85% memory utilization for 5 minutes

#### Infrastructure Alerts
- **Container Restarts**: Application container restarts >3 times in 10 minutes
- **High CPU Usage**: >80% CPU utilization for 5 minutes
- **Disk Space**: <10% free disk space
- **Database Disk Space**: <15% free space on database volume

#### Alert Channels
- **Email**: Critical alerts to on-call engineer
- **Slack/Discord**: General alerts to development channel
- **PagerDuty/OpsGenie**: Critical production issues

### Alert Response Procedures

#### Critical Alert (P1)
1. Acknowledge alert within 5 minutes
2. Assess impact and severity
3. Begin investigation using logs and monitoring
4. Communicate status to stakeholders
5. Implement fix or rollback
6. Post-mortem analysis

#### Warning Alert (P2)
1. Acknowledge within 15 minutes
2. Monitor for escalation
3. Investigate during business hours
4. Implement preventive fixes

## Metrics & Dashboards

### Key Metrics to Track

#### Application Metrics
- Request rate (requests/second)
- Error rate (percentage)
- Response time percentiles (P50, P95, P99)
- Active users/sessions
- API endpoint usage

#### Database Metrics
- Connection pool utilization
- Query execution time
- Deadlock count
- Cache hit ratio (if applicable)

#### Infrastructure Metrics
- CPU utilization
- Memory utilization
- Disk I/O
- Network traffic

### Dashboard Setup

#### Grafana Dashboard (Recommended)
Create dashboards for:
- Application performance overview
- Error rates and trends
- Database performance
- Infrastructure health

#### Sample Queries
```
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Response time percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

## Monitoring Tools

### Phase 1 Tool Stack
- **Application Monitoring**: Built-in health checks + custom logging
- **Error Tracking**: Sentry or similar (if budget allows)
- **Metrics**: Prometheus + Grafana (for detailed monitoring)
- **Alerting**: Email + Slack notifications

### Implementation Priority
1. Basic health checks and logging
2. Error tracking and alerting
3. Metrics collection and dashboards
4. Advanced monitoring and APM

## Troubleshooting Guide

### Common Issues

#### High Error Rate
1. Check application logs for error patterns
2. Verify database connectivity
3. Check external API status
4. Review recent deployments

#### Slow Response Times
1. Check database query performance
2. Monitor resource utilization
3. Review application logs for bottlenecks
4. Check external API response times

#### Memory Leaks
1. Monitor memory usage trends
2. Check for unclosed connections
3. Review garbage collection logs
4. Implement memory profiling

### Debug Commands
```bash
# Check application status
curl http://localhost:3000/health

# View recent logs
docker logs --tail 100 footdash-backend

# Check database connections
docker exec footdash-db psql -U postgres -d footdash -c "SELECT count(*) FROM pg_stat_activity;"

# Monitor resource usage
docker stats footdash-backend
```

## Maintenance Tasks

### Daily Checks
- Review error logs and alerts
- Check disk space and resource utilization
- Verify backup completion

### Weekly Tasks
- Review monitoring dashboards
- Analyze performance trends
- Update alert thresholds if needed

### Monthly Tasks
- Review and rotate logs
- Update monitoring configurations
- Conduct performance audits

---

**Note**: Start with basic health checks and logging, then gradually add more sophisticated monitoring as the application grows.