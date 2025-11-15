# FootDash

[![Backend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)
[![Frontend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)

A football dashboard application providing real-time match data, team statistics, and user authentication.

## Services

- **backend-nest/**: NestJS backend API with JWT authentication, match/team data, and Swagger documentation
- **frontend/**: Ionic/Angular frontend (currently static scaffold)
- **docker-compose.yml**: Local development composition with backend, frontend (nginx), and PostgreSQL database

> **Note**: The legacy Express backend has been archived to `archive/backend-legacy/` after Phase B completion. See tag `v1.0.0-legacy-backend` for the last version with both backends.

## Quick Start (Local Development)

### Backend (NestJS)

```bash
cd backend-nest
npm install
npm run start:dev
```

The API will be available at http://localhost:3000

### Frontend

Open `frontend/index.html` in a browser or serve via a local HTTP server.

### Docker

```bash
docker-compose up --build
```

## API Documentation

When the NestJS backend is running locally:

- **Swagger UI**: http://localhost:3000/api
- **OpenAPI JSON**: http://localhost:3000/api-json

## Configuration

The NestJS backend supports:

- **FOOTBALL_API_MOCK** (boolean): Set to `true` for mock Football API responses (no external credentials needed)
- **FOOTBALL_API_DEFAULT_LEAGUE** (number|string): Default league ID when omitted from requests

See `backend-nest/README.md` for full configuration options.

## CI / Testing

CI workflows for backend and frontend are in `.github/workflows/`. For troubleshooting and local reproduction, see `.github/CI-README.md`.

## Documentation

- **Architecture & Planning**: See `docs/` for technical architecture, API endpoints, and migration roadmap
- **Development Setup**: See `README.local-dev.md` for detailed local development instructions
- **Migrations**: See `backend-nest/MIGRATIONS.md` for database migration guide
- **Archive**: See `archive/` for historical reference to previous implementations

## Project Status

- ✅ **Phase A**: Angular/Ionic frontend scaffold - Complete
- ✅ **Phase B**: NestJS backend with full feature parity - Complete
- 🔄 **Phase C**: Frontend modularization - In Progress

For detailed roadmap, see `docs/migration-roadmap.md`.

