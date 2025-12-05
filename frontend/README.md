# FootDash Frontend (Ionic/Angular)

[![Frontend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)

Ionic/Angular-based progressive web application for football match tracking and team statistics.

## Features

- 📱 **Responsive Design** - Mobile-first UI with Ionic components
- 🎨 **Theme System** - Team-based color schemes and dark mode support
- 🔐 **Authentication** - JWT-based login with token refresh
- ⚽ **Team Pages** - View team statistics and match history
- 📊 **Match Tracking** - Real-time match data and results
- 🧩 **Modular Architecture** - Feature-based organization with shared components

## Prerequisites

- Node.js v18+
- npm or yarn
- Backend API running on http://localhost:3000 (or configure proxy)

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm start
```

Application will be available at http://localhost:4200

## Development

```bash
# Start dev server
npm start

# Build for production
npm run build

# Run linter
npm run lint

# Run tests
npm test

# Run tests in headless mode (CI)
npm test -- --watch=false --browsers=ChromeHeadless

# Run e2e tests
npm run e2e
```

## Project Structure

```
frontend/src/app/
├── core/              # Singleton services, guards, interceptors
│   ├── services/      # AuthService, ApiService
│   ├── guards/        # AuthGuard
│   └── interceptors/  # HTTP interceptors
├── shared/            # Reusable components and utilities
│   └── components/    # LoadingSpinner, DataCard
├── features/          # Feature modules
│   ├── auth/          # Login, register pages
│   ├── dashboard/     # Home page
│   ├── teams/         # Team listing and details
│   └── matches/       # Match listing and details
└── theme/             # SCSS design tokens and variables
```

## Configuration

### Proxy Configuration

The development server proxies API requests to the backend. Edit `proxy.conf.json` to change the backend URL:

```json
{
  "/api": {
    "target": "http://localhost:3000",
    "secure": false,
    "changeOrigin": true
  }
}
```

### Environment Files

- `src/environments/environment.ts` - Development config
- `src/environments/environment.prod.ts` - Production config

## Theme Customization

The app uses a token-based theme system in `src/theme/_tokens.scss`. Team-specific colors are defined and can be dynamically applied.

See `src/theme/variables.scss` for Ionic CSS custom properties.

## Testing

- **Unit Tests**: Karma + Jasmine
- **E2E Tests**: Playwright
- **Test Coverage**: `npm run test:coverage`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start dev server on port 4200 |
| `npm run build` | Build for production |
| `npm test` | Run unit tests with Karma |
| `npm run e2e` | Run Playwright e2e tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Documentation

- **Architecture**: `../docs/architecture/` - Frontend architecture patterns
- **Phase E Checklist**: `../docs/phase-e-checklist.md` - Current enhancement tasks
- **Migration Roadmap**: `../docs/migration-roadmap.md` - Project evolution

## Contributing

See the root `README.md` for project status and development workflow.
