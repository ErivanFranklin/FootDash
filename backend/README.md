# FootDash Backend (NestJS)

[![Backend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)

NestJS-based REST API providing authentication, team data, match information, and integration with football-data.org API.

## Features

- 🔐 **JWT Authentication** - Secure user registration, login, and token refresh
- ⚽ **Teams Module** - Team information and statistics from external APIs
- 📊 **Matches Module** - Match data with metadata (referee, venue, league)
- 🗄️ **TypeORM** - Database migrations and entity management
- 📝 **Swagger/OpenAPI** - Interactive API documentation
- 🧪 **Comprehensive Testing** - Unit and e2e tests with PostgreSQL
- 🐳 **Docker Ready** - Containerized setup for development and production

## Prerequisites

- Node.js v18+
- PostgreSQL 14+ (or use Docker)
- npm or yarn

## Project Setup

```bash
# Install dependencies
npm install

# Configure environment (copy and edit)
cp .env.example .env
```

### Environment Variables

Key variables (see `.env.example` for full list):

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL connection
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` - Token expiration times
- `FOOTBALL_API_KEY` - Optional API key for football-data.org
- `FOOTBALL_API_MOCK=true` - Use mock data (no external API required)

## Database Setup

```bash
# Run migrations
npm run migrate:run

# Check migration status
npm run migrate:show

# Seed development data
npm run seed:dev
```

For detailed migration usage, see `MIGRATIONS.md`.

## Development

```bash
# Start development server with hot-reload
npm run start:dev

# Start in production mode
npm run start:prod
```

API will be available at http://localhost:3000

### API Documentation

- **Swagger UI**: http://localhost:3000/api
- **OpenAPI JSON**: http://localhost:3000/api-json

## Testing

```bash
# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run e2e tests (requires PostgreSQL)
npm run test:e2e

# Run specific e2e test file
npm run test:e2e -- auth.postgres.e2e-spec.ts

# Test coverage
npm run test:cov
```

### Test Database

E2e tests use a separate test database configured via environment variables:
- Uses `DB_NAME_TEST` or defaults to `footdash_test`
- Automatically runs migrations before tests
- Cleans up data between test suites

## Module Structure

```
backend/src/
├── auth/          # JWT authentication, guards, strategies
├── users/         # User entity and service
├── teams/         # Team data from external API
├── matches/       # Match data with metadata
├── football-api/  # Football-data.org API integration
├── db/            # Database configuration
└── common/        # Shared utilities and constants
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start development server with hot-reload |
| `npm run build` | Build for production |
| `npm run start:prod` | Run production build |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run migrate:run` | Run pending migrations |
| `npm run migrate:show` | Show migration status |
| `npm run migrate:revert` | Revert last migration |
| `npm run seed:dev` | Seed development data |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Documentation

- **Migrations Guide**: `MIGRATIONS.md` - Database migration usage and commands
- **API Endpoints**: `../docs/api/endpoints.md` - Full API documentation
- **Architecture**: `../docs/architecture/` - System design and patterns
- **Phase E Checklist**: `../docs/phase-e-checklist.md` - Current cleanup tasks

## Contributing

See the root `README.md` and `docs/migration-roadmap.md` for project status and development workflow.


## Local development notes

This backend provides a small adapter to an external Football API and supports a mock mode for local development.

- FOOTBALL_API_MOCK (boolean): when set to `true` the Football API adapter returns deterministic mock data so you can develop and test without external API credentials.
- FOOTBALL_API_DEFAULT_LEAGUE (number|string): optional default league id used by endpoints that normally require a `leagueId` query parameter. The service accepts this value as a number or a string (it will coerce strings to numbers when possible).

Swagger / OpenAPI docs are available at:

- HTML UI: http://localhost:3000/api
- OpenAPI JSON: http://localhost:3000/api-json

When running locally in mock mode you can omit `leagueId` for team stats endpoints; the server will use `FOOTBALL_API_DEFAULT_LEAGUE` if provided, or fall back to a dummy id when mock mode is enabled.


