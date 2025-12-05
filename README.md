# FootDash

[![Backend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)
[![Frontend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)

A football dashboard application providing real-time match data, team statistics, and user authentication.

## Services

- **backend/**: NestJS backend API with JWT authentication, match/team data, and Swagger documentation
- **frontend/**: Ionic/Angular frontend (currently static scaffold)
- **docker-compose.yml**: Local development composition with backend, frontend (nginx), and PostgreSQL database

> **Note**: The legacy Express backend has been archived to `archive/backend-legacy/` after Phase B completion. See tag `v1.0.0-legacy-backend` for the last version with both backends.

## Quick Start (Local Development)

### Prerequisites

- Node.js v18+ (or use the provided Docker setup)
- PostgreSQL (or use Docker)
- npm or yarn

### Option 1: Docker (Recommended)

```bash
# Start all services (backend, frontend, database)
docker-compose up --build
```

- Backend API: http://localhost:3000
- Frontend: http://localhost:4200
- Swagger Docs: http://localhost:3000/api

### Option 2: Local Development

**1. Start PostgreSQL**
```bash
# Using Docker for database only
docker-compose -f docker-compose.db.yml up -d

# Or use local PostgreSQL instance (ensure DB 'footdash' exists)
```

**2. Backend Setup**
```bash
cd backend
npm install

# Run migrations
npm run migrate:run

# Seed dev data (optional)
npm run seed:dev

# Start development server
npm run start:dev
```

Backend will be available at http://localhost:3000

**3. Frontend Setup**
```bash
cd frontend
npm install
npm start
```

Frontend will be available at http://localhost:4200

## API Documentation

When the NestJS backend is running locally:

- **Swagger UI**: http://localhost:3000/api
- **OpenAPI JSON**: http://localhost:3000/api-json

## Configuration

The NestJS backend supports:

- **FOOTBALL_API_MOCK** (boolean): Set to `true` for mock Football API responses (no external credentials needed)
- **FOOTBALL_API_DEFAULT_LEAGUE** (number|string): Default league ID when omitted from requests

See `backend/README.md` for full configuration options.

## CI / Testing

CI workflows for backend and frontend are in `.github/workflows/`. For troubleshooting and local reproduction, see `.github/CI-README.md`.

## Documentation

- **Architecture & Planning**: See `docs/` for technical architecture, API endpoints, and migration roadmap
- **Development Setup**: See `README.local-dev.md` for detailed local development instructions
- **Migrations**: See `backend/MIGRATIONS.md` for database migration guide
- **Archive**: See `archive/` for historical reference to previous implementations

## Project Status

- ✅ **Phase A**: Angular/Ionic frontend scaffold - Complete
- ✅ **Phase B**: NestJS backend with full feature parity - Complete
- ✅ **Phase C**: Frontend modularization - Complete
- ✅ **Phase D**: DevOps consolidation - Complete
- 🔄 **Phase E**: Cleanup & Enhancements - In Progress
  - ✅ Database migrations system operational
  - ✅ Frontend proxy configuration fixed
  - 🔄 README updates and documentation improvements

For detailed roadmap, see `docs/migration-roadmap.md` and the Phase E checklist at `docs/phase-e-checklist.md`.

