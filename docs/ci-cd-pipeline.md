# CI/CD Pipeline Documentation

## Overview

The FootDash project has been enhanced with comprehensive CI/CD workflows to automate testing, building, deploying, and maintaining the application. This document outlines the workflow structure and how to use them.

## Workflows

### 1. Enhanced CI Pipeline (`enhanced-ci.yml`)

**Trigger:** 
- Push to `main`, `feature/**`, `hotfix/**` branches
- Pull requests to `main`

**Features:**
- **Change Detection**: Automatically detects which parts of the codebase changed (backend/frontend/infra)
- **Parallel Execution**: Backend and frontend tests run in parallel for faster feedback
- **Unit Tests**: Jest with code coverage reporting
- **E2E Tests**: End-to-end tests with PostgreSQL
- **Docker Builds**: Automatic Docker image building with layer caching
- **Security Scanning**: 
  - npm audit for dependency vulnerabilities
  - Trivy vulnerability scanning
  - Results uploaded to GitHub Security tab
- **Code Coverage**: Automatic codecov uploads
- **Test Reporting**: Published results with PR comments

**Jobs:**
1. `detect-changes` - Identifies changed files
2. `backend-tests` - Runs backend unit and e2e tests
3. `frontend-tests` - Runs frontend lint, unit tests, and build
4. `docker-build-backend` - Builds backend Docker image
5. `docker-build-frontend` - Builds frontend Docker image
6. `security-scan` - Performs security scanning
7. `test-summary` - Publishes test results
8. `ci-complete` - Final status check

**Configuration:**
- 4 parallel Jest workers for optimal performance
- PostgreSQL 15 for testing
- Chromium headless for frontend tests
- Coverage thresholds enforced

### 2. Production Deployment (`deploy-production.yml`)

**Trigger:**
- Manual workflow dispatch with environment selection
- Push to `main` (for staging only)

**Features:**
- **Multi-Environment Support**: Staging and production deployments
- **Blue-Green Deployment**: Supports zero-downtime deployments
- **Pre-Deployment Backup**: Automatic database backups before production deployment
- **Health Checks**: Automated health checks after deployment
- **Smoke Tests**: Quick validation tests
- **Slack Notifications**: Deployment status alerts
- **Rollback Support**: Automatic rollback on failure
- **Environment Separation**: Different secrets and URLs per environment

**Deployment Steps:**
1. Build Docker images
2. Deploy to staging (automatic on push to main)
3. Run smoke tests
4. Manual approval for production
5. Backup existing database
6. Deploy to production
7. Health checks and validation
8. Notification and deployment record

**Required Secrets:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `SLACK_WEBHOOK_URL` (optional)

### 3. Maintenance Workflow (`maintenance.yml`)

**Trigger:**
- Weekly on Mondays at 6:00 AM UTC
- Manual workflow dispatch

**Features:**
- **Dependency Updates**: Automatic npm updates with PR creation
- **Security Audits**: npm audit scanning with vulnerability tracking
- **Code Quality**: Linting and formatting checks
- **Migration Testing**: Tests database migrations up and down
- **Performance Analysis**: Bundle size analysis and performance checks
- **Artifact Cleanup**: Removes artifacts older than 30 days

**Jobs:**
1. `update-dependencies` - Creates PR with dependency updates
2. `security-audit` - Scans for vulnerabilities
3. `code-quality` - Checks code quality and formatting
4. `test-migrations` - Tests database migrations
5. `performance-test` - Analyzes bundle size and performance
6. `cleanup-artifacts` - Cleans up old artifacts

## Pipeline Architecture

```
Push to main/PR created
    ↓
┌─────────────────────────────────────┐
│    Detect Changes (parallel)         │
│  - Backend changed?                  │
│  - Frontend changed?                 │
│  - Infra changed?                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Parallel Execution (if changed)     │
├─────────────────────────────────────┤
│  Backend Tests          │ Frontend Tests
│  - Lint                 │ - Lint
│  - Unit Tests           │ - Unit Tests
│  - Coverage Report      │ - Build
│  - E2E Tests            │ - Coverage Report
│  - Artifact Upload      │ - Artifact Upload
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Docker Builds (if infra changed)    │
│  - Backend Image                     │
│  - Frontend Image                    │
│  - Registry Push                     │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Security Scanning                   │
│  - Dependency Audit                  │
│  - Trivy Scan                        │
│  - Results Upload                    │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│  Test Reporting                      │
│  - Publish Results                   │
│  - Comment PR                        │
└─────────────────────────────────────┘
    ↓
  [CI Complete]
```

## Configuration

### Environment Variables

**Backend Tests:**
- `WORKERS`: Number of Jest workers (default: 4)
- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_USERNAME`: Database user
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name

**Frontend Tests:**
- `CHROME_BIN`: Path to Chromium binary
- `NODE_VERSION`: Node.js version (default: 20)

### GitHub Secrets

For production deployments, configure these secrets:

```
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=us-east-1
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxxx
```

## Performance Optimizations

1. **Dependency Caching**: Node modules cached per workflow
2. **Docker Layer Caching**: Build cache stored in registry
3. **Parallel Execution**: Independent jobs run simultaneously
4. **Change Detection**: Only affected components are tested
5. **Artifact Management**: Old artifacts automatically cleaned up

## Monitoring and Alerts

### GitHub Security Alerts
- Trivy vulnerability scan results appear in Security tab
- npm audit vulnerabilities are logged and reported

### CodeCov Integration
- Code coverage reports uploaded automatically
- Coverage trends tracked over time
- Fails if coverage drops below threshold

### Slack Notifications
- Deployment status alerts
- Failed build notifications
- Production deployment announcements

## Troubleshooting

### Workflow Failures

**Backend tests failing:**
1. Check PostgreSQL service is healthy
2. Verify database initialization
3. Review migration logs
4. Check test output artifacts

**Frontend tests failing:**
1. Verify Chromium is installed
2. Check `CHROME_BIN` environment variable
3. Review test output artifacts
4. Check for missing dependencies

**Docker builds failing:**
1. Verify image layer sizes
2. Check Dockerfile syntax
3. Review build logs
4. Verify registry credentials

### Performance Issues

1. **Slow tests**: Increase `WORKERS` count or parallelize jobs
2. **Cache misses**: Check package-lock.json is committed
3. **Large images**: Review Dockerfile and remove unnecessary layers
4. **Long deployments**: Use blue-green deployments for faster rollback

## Future Enhancements

1. **Load Testing**: Automated performance tests before production
2. **Compliance Scanning**: SonarQube or similar code quality gates
3. **Database Backups**: Automated backup verification
4. **Cost Optimization**: Resource usage monitoring
5. **Custom Metrics**: Application-specific health checks
6. **Canary Deployments**: Gradual rollout to production

## Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Documentation](https://docs.docker.com/build/)
- [CodeCov Documentation](https://docs.codecov.io/)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)
