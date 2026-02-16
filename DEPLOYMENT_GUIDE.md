# FootDash Deployment Guide

## Quick Start

### Start All Services
```bash
./scripts/start-all.sh
```

This single command will:
- ✓ Start PostgreSQL database
- ✓ Start Redis cache
- ✓ Start Backend API (NestJS)
- ✓ Start Frontend Dev Server (Angular/Ionic)

**Access the application:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api
- API Documentation: http://localhost:3000/api/docs

### Stop All Services
```bash
./scripts/stop-all.sh
```

### Check Service Status
```bash
./scripts/status.sh
```

---

## Prerequisites

Before starting FootDash, ensure you have:

1. **Docker Desktop** - Running
2. **Node.js** - v18 or v20 (LTS versions recommended)
3. **npm** - v9 or higher

### Verify Prerequisites
```bash
# Check Docker
docker --version
docker info

# Check Node.js
node --version

# Check npm
npm --version
```

---

## Manual Service Management

If you prefer to start services individually or troubleshoot:

### 1. Start Database & Cache

**PostgreSQL:**
```bash
docker start footdash-postgres-local

# Or create new if doesn't exist:
docker run -d \
  --name footdash-postgres-local \
  -e POSTGRES_USER=footdash_user \
  -e POSTGRES_PASSWORD=footdash_pass \
  -e POSTGRES_DB=footdash_dev \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15-alpine

# Verify:
docker exec footdash-postgres-local pg_isready -U footdash_user
```

**Redis:**
```bash
docker start footdash-redis-local

# Or create new if doesn't exist:
docker run -d \
  --name footdash-redis-local \
  -p 6379:6379 \
  redis:7-alpine

# Verify:
docker exec footdash-redis-local redis-cli ping
```

### 2. Start Backend API

```bash
cd backend

# Make sure .env file exists
cat .env

# Start in development mode
npm run start:dev

# Or start in production mode
npm run build
npm run start:prod
```

**Backend will be available at:** http://localhost:3000

**Health check:**
```bash
curl http://localhost:3000/api/health
```

### 3. Start Frontend

**Option A: Development Server (recommended for development)**
```bash
cd frontend
npm start
```
Frontend available at: http://localhost:4200

**Option B: Production Build + Docker**
```bash
cd frontend

# Build for production
npm run build

# Start with Docker
docker run -d \
  --name footdash-frontend \
  -p 8080:80 \
  footdash:latest
```
Frontend available at: http://localhost:8080

---

## Troubleshooting

### Services Won't Start

**PostgreSQL issues:**
```bash
# Check container logs
docker logs footdash-postgres-local

# Restart container
docker restart footdash-postgres-local

# Remove and recreate if corrupted
docker rm -f footdash-postgres-local
# Then run the docker run command from above
```

**Backend API issues:**
```bash
# Check backend logs
tail -f /tmp/footdash-backend.log

# Or if running in terminal:
cd backend
npm run start:dev

# Check if port 3000 is already in use
lsof -i :3000
# Kill process if needed:
kill -9 <PID>
```

**Frontend issues:**
```bash
# Check frontend logs
tail -f /tmp/footdash-frontend.log

# Rebuild if needed
cd frontend
rm -rf www node_modules/.cache
npm run build

# Check if port 4200 is already in use
lsof -i :4200
```

### Database Connection Issues

**Check database credentials:**
```bash
cat backend/.env
```

Should contain:
```
DATABASE_URL=postgres://footdash_user:footdash_pass@localhost:5432/footdash_dev
```

**Test connection:**
```bash
docker exec -it footdash-postgres-local psql -U footdash_user -d footdash_dev
```

**Run migrations:**
```bash
cd backend
npm run migration:run
```

### User Registration Not Working

**Verify all services are running:**
```bash
./scripts/status.sh
```

**Check backend health:**
```bash
curl http://localhost:3000/api/health
```

**Test registration endpoint:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "securePassword123",
    "username": "testuser"
  }'
```

**Common issues:**
- Backend not started → Run `./scripts/start-all.sh`
- Database not ready → Wait 10 seconds after starting PostgreSQL
- Frontend pointing to wrong API → Check `frontend/src/environments/environment.ts`

---

## Environment Configuration

### Backend Environment Variables

Create `backend/.env`:
```bash
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgres://footdash_user:footdash_pass@localhost:5432/footdash_dev

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Football API (optional)
FOOTBALL_API_KEY=your-api-key-here
```

### Frontend Environment

`frontend/src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
};
```

`frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.com/api',
  wsUrl: 'wss://your-domain.com',
};
```

---

## Production Deployment

### Option 1: Docker Compose (Recommended)

The easiest way to deploy FootDash:

```bash
# Production deployment
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Services will be available at:
- Frontend: http://localhost
- Backend: http://localhost:3000

### Option 2: Cloud Deployment

#### Prerequisites for Cloud Deployment:

1. **Database**: PostgreSQL database (RDS, Cloud SQL, etc.)
2. **Redis**: Redis instance (ElastiCache, Cloud Memorystore, etc.)
3. **Environment Variables**: Set in your cloud provider

#### Deploy Backend:

**Heroku:**
```bash
cd backend
heroku create footdash-api
heroku addons:create heroku-postgresql:mini
heroku addons:create heroku-redis:mini
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

**Railway:**
```bash
cd backend
railway login
railway init
railway add postgresql
railway add redis
railway up
```

**Render:**
- Connect GitHub repository
- Select "Web Service"
- Build command: `cd backend && npm install && npm run build`
- Start command: `cd backend && npm run start:prod`
- Add environment variables

#### Deploy Frontend:

**Vercel:**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
cd frontend
npm run build
netlify deploy --prod --dir=www
```

**AWS S3 + CloudFront:**
```bash
cd frontend
npm run build

# Upload to S3
aws s3 sync www/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

---

## Development Workflow

### Daily Development

```bash
# Start all services
./scripts/start-all.sh

# Check status
./scripts/status.sh

# Do your development work...

# Stop when done
./scripts/stop-all.sh
```

### Frontend Development Only

If you only need to work on the frontend:

```bash
# Start backend services
docker start footdash-postgres-local footdash-redis-local
cd backend && npm run start:dev &

# Start frontend
cd frontend
npm start
```

### Backend Development Only

```bash
# Start database/cache
docker start footdash-postgres-local footdash-redis-local

# Start backend with watch mode
cd backend
npm run start:dev
```

### Database Migrations

**Create migration:**
```bash
cd backend
npm run migration:create -- -n YourMigrationName
```

**Run migrations:**
```bash
npm run migration:run
```

**Revert migration:**
```bash
npm run migration:revert
```

---

## Performance Optimization

### Frontend Build Optimization

```bash
cd frontend

# Standard build
npm run build

# Optimized build with caching
npm run build:optimized

# Docker build
npm run build:docker

# Analyze bundle size
npm run build:analyze
```

### Backend Performance

```bash
cd backend

# Production build (optimized)
npm run build

# Start with PM2 (process manager)
npm install -g pm2
pm2 start dist/main.js --name footdash-api
pm2 save
pm2 startup
```

---

## Monitoring & Logs

### View Real-time Logs

```bash
# Backend logs
tail -f /tmp/footdash-backend.log

# Frontend logs
tail -f /tmp/footdash-frontend.log

# Docker logs
docker logs -f footdash-postgres-local
docker logs -f footdash-redis-local
```

### Check Service Health

```bash
# Status script
./scripts/status.sh

# Manual checks
curl http://localhost:3000/api/health
curl http://localhost:4200

# Database connection
docker exec footdash-postgres-local pg_isready -U footdash_user

# Redis connection
docker exec footdash-redis-local redis-cli ping
```

---

## Quick Reference

### Service Ports

| Service    | Port | URL                              |
|------------|------|----------------------------------|
| Frontend   | 4200 | http://localhost:4200            |
| Backend    | 3000 | http://localhost:3000/api        |
| PostgreSQL | 5432 | localhost:5432                   |
| Redis      | 6379 | localhost:6379                   |

### Useful Commands

```bash
# Start everything
./scripts/start-all.sh

# Stop everything
./scripts/stop-all.sh

# Check status
./scripts/status.sh

# View logs
tail -f /tmp/footdash-backend.log
tail -f /tmp/footdash-frontend.log

# Docker status
docker ps
docker logs footdash-postgres-local

# Database access
docker exec -it footdash-postgres-local psql -U footdash_user -d footdash_dev

# Redis CLI
docker exec -it footdash-redis-local redis-cli

# Check open ports
lsof -i :3000  # Backend
lsof -i :4200  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
```

---

## Support

If you encounter issues:

1. Check service status: `./scripts/status.sh`
2. View logs: `tail -f /tmp/footdash-backend.log`
3. Verify prerequisites (Docker, Node.js)
4. Restart services: `./scripts/stop-all.sh && ./scripts/start-all.sh`
5. Check the troubleshooting section above

For more help, see:
- `docs/` directory for detailed documentation
- `README.md` for project overview
- `backend/README.md` for backend-specific docs
- `frontend/README.md` for frontend-specific docs
