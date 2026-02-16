# FootDash - Quick Start Guide

## ✅ All Services Are Running!

Your FootDash application is now fully operational. Here's what you need to know:

---

## 🚀 Access Your Application

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | http://localhost:4200 | ✓ Running |
| **Backend API** | http://localhost:3000/api | ✓ Running |
| **API Docs** | http://localhost:3000/api/docs | ✓ Available |
| **Database** | localhost:5432 | ✓ Running |
| **Redis** | localhost:6379 | ✓ Running |

---

## 📝 Essential Commands

### Start/Stop Services

```bash
# Start all services (database, backend, frontend)
./scripts/start-all.sh

# Stop all services
./scripts/stop-all.sh

# Check status of all services
./scripts/status.sh
```

### View Logs

```bash
# Backend logs
tail -f /tmp/footdash-backend.log

# Frontend logs
tail -f /tmp/footdash-frontend.log
```

---

## 🧪 Test User Registration

Your registration endpoint is working! Test it:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your@email.com",
    "password": "yourPassword123"
  }'
```

**Required fields:**
- `email` - Valid email address
- `password` - Minimum 6 characters

**Successful response includes:**
- User ID and email
- Access token (JWT)
- Refresh token

---

## 🛠 Development Workflow

### Daily Development

```bash
# Morning: Start everything
./scripts/start-all.sh

# Check everything is running
./scripts/status.sh

# Open frontend in browser
open http://localhost:4200

# Do your development work...

# Evening: Stop everything
./scripts/stop-all.sh
```

### Frontend Development

```bash
cd frontend

# Start dev server (if not already running)
npm start

# Build for production
npm run build

# Analyze bundle size
npm run build:analyze
```

### Backend Development

```bash
cd backend

# Start with hot reload (if not already running)
npm run start:dev

# Run tests
npm test

# Run migrations
npm run migration:run
```

---

## 🔍 Troubleshooting

### Services won't start?

```bash
# Check status
./scripts/status.sh

# Stop everything and restart
./scripts/stop-all.sh
sleep 5
./scripts/start-all.sh
```

### Port already in use?

```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :4200  # Frontend

# Kill the process
kill -9 <PID>
```

### Database connection issues?

```bash
# Check database is running
docker ps | grep postgres

# Check connection
docker exec footdash-postgres-local pg_isready -U footdash_user

# Restart database
docker restart footdash-postgres-local
```

### Registration not working?

1. Check backend is running: `./scripts/status.sh`
2. Check backend health: `curl http://localhost:3000/api/health`
3. View backend logs: `tail -f /tmp/footdash-backend.log`
4. Ensure database is ready: `docker ps | grep postgres`

---

## 📚 Documentation

For more detailed information:

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[BUILD_OPTIMIZATION.md](frontend/BUILD_OPTIMIZATION.md)** - Frontend build optimization
- **[README.md](README.md)** - Project overview
- **API Documentation** - http://localhost:3000/api/docs

---

## 🎯 What You Built Outside VSCode

When you build the frontend outside VSCode:

```bash
cd frontend
npm run build
```

**This creates:**
- Production-optimized bundle in `www/` directory
- 3.1 MB total size, 600 KB transferred (gzip)
- 163 files including 109 lazy-loaded chunks

**But it doesn't start the servers!** Building just compiles the code. To run the application, you need all services running (which you now have with `./scripts/start-all.sh`).

---

## ✨ What's Running Now

After running `./scripts/start-all.sh`, you have:

1. **PostgreSQL Database**
   - Container: `footdash-postgres-local`
   - Port: 5432
   - Database: `footdash_dev`
   - User: `footdash_user`

2. **Redis Cache**
   - Container: `footdash-redis-local`
   - Port: 6379

3. **Backend API (NestJS)**
   - Process running in background
   - Port: 3000
   - Health check: ✓ OK
   - Logs: `/tmp/footdash-backend.log`

4. **Frontend Dev Server (Angular)**
   - Process running in background
   - Port: 4200
   - Hot reload enabled
   - Logs: `/tmp/footdash-frontend.log`

---

## 🎉 Success!

Your FootDash application is fully functional. You can now:

- ✓ Register users
- ✓ Login to the application
- ✓ Access all features
- ✓ Develop with hot reload
- ✓ Build for production

**Next Steps:**
1. Open http://localhost:4200 in your browser
2. Try registering a new user
3. Start developing your features!

---

## 💡 Quick Tips

- Always use `./scripts/start-all.sh` to start all services together
- Use `./scripts/status.sh` to check if everything is running
- Check logs if something isn't working: `tail -f /tmp/footdash-*.log`
- The frontend at port 4200 supports hot reload during development
- The Docker container at port 8080 serves the production build

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for comprehensive documentation.
