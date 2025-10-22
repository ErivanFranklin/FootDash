# 007 — Phase 1 Scaffold Plan

let’s create a complete scaffold plan for your Football Dashboard application (frontend + backend) so you can start coding confidently.

## 🧱 Project Overview

- Name: football-dashboard
- Architecture: Frontend (Angular + Ionic) + Backend (NestJS)
- Goal: Modular, secure, theme-based football dashboard consuming live data APIs.

## 🗂️ 1. Folder Structure

Root (Monorepo style)

```
football-dashboard/
├── frontend/               # Angular + Ionic app
├── backend/                # NestJS API
├── docker/                 # Docker configs for services
├── docs/                   # Docs and diagrams
├── .env                    # Shared environment vars
├── docker-compose.yml
└── README.md
```

## ⚙️ 2. Backend Scaffold (NestJS)

### 📦 Folder Structure

```
backend/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/
│   │   ├── app.config.ts
│   │   └── db.config.ts
│   ├── common/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── dto/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── jwt.strategy.ts
│   ├── users/
│   ├── teams/
│   ├── matches/
│   ├── football-api/
│   │   ├── football-api.module.ts
│   │   ├── football-api.service.ts
│   │   └── football-api.interface.ts
│   └── database/
│       └── entities/
├── test/
├── package.json
└── tsconfig.json
```

### 🧰 CLI Commands

```bash
# Create NestJS project
npx @nestjs/cli new backend

cd backend

# Install dependencies
npm install @nestjs/config @nestjs/typeorm typeorm pg bcryptjs @nestjs/passport passport passport-jwt jsonwebtoken axios class-validator class-transformer helmet cors

# Generate modules
nest g module auth
nest g controller auth
nest g service auth

nest g module users
nest g controller users
nest g service users

nest g module teams
nest g module matches
nest g module football-api
```

### 🛡️ Security & Middleware

In `main.ts`:

```ts
app.enableCors();
app.use(helmet());
app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
```

## 💻 3. Frontend Scaffold (Angular + Ionic)

### 📦 Folder Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── services/
│   │   │   ├── interceptors/
│   │   │   └── guards/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── team/
│   │   │   └── charts/
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   ├── directives/
│   │   │   └── pipes/
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   ├── assets/
│   │   └── themes/
│   ├── environments/
│   └── styles/
│       └── theme.scss
└── angular.json
```

### 🧰 CLI Commands

```bash
# Create Ionic Angular app
npm install -g @ionic/cli
ionic start frontend dashboard --type=angular --style=scss

cd frontend

# Add libraries
npm install @angular/material ngx-charts @auth0/angular-jwt
```

### 🎨 Dynamic Theming

In `theme.scss`:

```scss
:root {
  --primary-color: #0044cc; // default
}

.team-theme {
  --primary-color: var(--team-color);
}
```

## 🧩 4. API Integration Layer

Backend → Football Data API (via Axios)

```ts
// football-api.service.ts
@Injectable()
export class FootballApiService {
  private readonly apiUrl = process.env.FOOTBALL_API_URL;
  private readonly apiKey = process.env.FOOTBALL_API_KEY;

  async getTeamStats(teamId: string) {
    const res = await axios.get(`${this.apiUrl}/teams/${teamId}`, {
      headers: { 'x-apisports-key': this.apiKey },
    });
    return res.data;
  }
}
```

## 🔐 5. Authentication Flow

- User registers → Backend saves hashed password (bcrypt)
- User logs in → Backend issues JWT (access + refresh)
- Frontend stores JWT in memory/localStorage
- Interceptors attach JWT to requests
- Guards protect private routes

## ☁️ 6. Deployment Setup

Docker Compose with:

- backend (NestJS)
- frontend (Angular)
- db (PostgreSQL)
- pgadmin (optional)

CI/CD via GitHub Actions

Hosting:

- Frontend: Vercel / Netlify / Azure Static Web Apps
- Backend: Render / Railway / Azure App Service
- DB: Supabase / Neon / Azure PostgreSQL
