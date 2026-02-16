# Local Development Guide

This guide explains how to develop FootDash entirely on your local machine **without any cloud costs**.

---

## 💻 Prerequisites

1. **Docker Desktop** (for PostgreSQL and Redis)
   - [Download for Mac](https://www.docker.com/products/docker-desktop)
   - Make sure Docker is running before starting

2. **Node.js 20+**
   ```bash
   node --version  # Should be v20 or higher
   ```

3. **Git** (already installed)

---

## 🚀 Quick Start

### 1. Start Local Services

```bash
# Make scripts executable (first time only)
chmod +x scripts/local-dev-*.sh

# Start PostgreSQL + Redis
./scripts/local-dev-start.sh
```

This will:
- Start PostgreSQL on `localhost:5432`
- Start Redis on `localhost:6379`
- Create `backend/.env` with local settings
- Install dependencies
- Run database migrations

### 2. Start Backend API

```bash
cd backend
npm run start:dev
```

**Backend will run on**: http://localhost:3000  
**API endpoints**: http://localhost:3000/api  
**Swagger docs**: http://localhost:3000/api

### 3. Start Frontend

Open a **new terminal**:

```bash
cd frontend
npm start
```

**Frontend will run on**: http://localhost:4200

---

## 📂 Project Structure

```
FootDash/
├── backend/              # NestJS API
│   ├── src/             # Source code
│   ├── migrations/      # Database migrations
│   └── .env             # Local environment (auto-created)
├── frontend/            # Angular/Ionic app
│   └── src/            # Frontend source
├── docker-compose.local.yml  # Local PostgreSQL + Redis
└── scripts/
    ├── local-dev-start.sh    # Start local environment
    └── local-dev-stop.sh     # Stop local environment
```

---

## 🛠️ Common Tasks

### View Database

```bash
# Connect to PostgreSQL
docker exec -it footdash-postgres-local psql -U footdash_user -d footdash_dev

# Inside psql:
\dt                    # List tables
\d users              # Describe users table
SELECT * FROM users;  # Query users
\q                    # Quit
```

### Run Database Migrations

```bash
cd backend

# Run pending migrations
npm run migrate:run

# Show migration status
npm run migrate:show
```

### Seed Development Data

```bash
cd backend
npm run seed:dev
```

### Run Tests

```bash
# Backend tests
cd backend
npm test                  # Unit tests
npm run test:e2e         # E2E tests

# Frontend tests
cd frontend
npm test
```

### Reset Database

```bash
# Stop services and delete all data
docker-compose -f docker-compose.local.yml down -v

# Restart
./scripts/local-dev-start.sh
```

---

## 🐛 Troubleshooting

### "Docker is not running"

1. Open Docker Desktop
2. Wait for it to fully start (whale icon stops animating)
3. Run `./scripts/local-dev-start.sh` again

### "Port 5432 already in use"

Another PostgreSQL instance is running:

```bash
# Find what's using port 5432
lsof -i :5432

# Stop it or use a different port in docker-compose.local.yml
```

### "Cannot connect to database"

```bash
# Check if PostgreSQL container is running
docker ps | grep footdash-postgres

# Check logs
docker logs footdash-postgres-local

# Restart containers
./scripts/local-dev-stop.sh
./scripts/local-dev-start.sh
```

### Backend won't start

```bash
# Check backend/.env exists
cat backend/.env

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Frontend won't start

```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🔥 Hot Reload

Both backend and frontend support hot reload:

- **Backend**: Changes to `.ts` files automatically restart the server
- **Frontend**: Changes to `.ts`/`.html`/`.scss` files automatically refresh the browser

---

## 📊 Viewing Logs

### Backend Logs
Just watch the terminal where you ran `npm run start:dev`

### Database Logs
```bash
docker logs -f footdash-postgres-local
```

### Redis Logs
```bash
docker logs -f footdash-redis-local
```

---

## 🧪 Testing Your Changes

### Test Backend API

```bash
# Health check
curl http://localhost:3000

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Test Frontend

1. Open http://localhost:4200
2. Test registration/login
3. Check browser console for errors (F12 → Console)

---

## 🎯 Development Workflow

1. **Morning**: Run `./scripts/local-dev-start.sh`
2. **Code**: Make changes, test locally
3. **Commit**: `git add . && git commit -m "Your message"`
4. **Evening**: Run `./scripts/local-dev-stop.sh` to save resources

---

## ☁️ Deploying to Azure (Later)

Once everything works locally:

1. **Update configurations** in `docs/ops/azure-dev-deployment.md`
2. **Test container locally** with Docker:
   ```bash
   cd backend
   docker build -t footdash-api:local .
   docker run -p 3000:80 \
     -e DATABASE_URL="your_azure_db_url" \
     -e JWT_SECRET="your_jwt_secret" \
     footdash-api:local
   ```
3. **Follow Azure deployment guide** (after local testing succeeds)

---

## 💰 Cost Comparison

| Environment | Daily Cost | Monthly Cost |
|-------------|-----------|--------------|
| **Local Development** | €0.00 | €0.00 |
| **Azure (all running)** | €1.27 | €38.10 |
| **Azure (stopped)** | €0.98 | €29.40 |

**Recommendation**: Develop locally, only deploy to Azure for final testing or production.

---

## 📝 Environment Variables

All local environment variables are in `.env.local` and auto-copied to `backend/.env`.

**Never commit** `backend/.env` to Git (it's in `.gitignore`).

For Azure deployment, use Key Vault for secrets.

---

## 🆘 Getting Help

- **Backend issues**: Check `backend/README.md`
- **Frontend issues**: Check `frontend/README.md`
- **Database issues**: Check Docker logs
- **General setup**: Re-run `./scripts/local-dev-start.sh`

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `docker ps` shows `footdash-postgres-local` running
- [ ] `docker ps` shows `footdash-redis-local` running
- [ ] Backend starts without errors (`cd backend && npm run start:dev`)
- [ ] http://localhost:3000 returns a response
- [ ] http://localhost:3000/api shows Swagger docs
- [ ] Frontend starts (`cd frontend && npm start`)
- [ ] http://localhost:4200 loads the app
- [ ] Can register a new user
- [ ] Can login with registered user

---

**Happy coding! 🚀**
