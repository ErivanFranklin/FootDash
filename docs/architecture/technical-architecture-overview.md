# Technical Architecture Overview

> Source: `prompt/005-phase-1-technical-architecture-diagram-stack explanation.md`

The Football Dashboard architecture separates the frontend Ionic application from the backend API to keep the system modular, secure, and scalable.

## High-Level Diagram

```
                 ┌───────────────────────────────┐
                 │         CLIENT (UI)           │
                 │  Angular + Ionic Application  │
                 │  (Web + Mobile)               │
                 │                               │
                 │  - Login / Register           │
                 │  - Team Dashboard             │
                 │  - Charts & Visualisations    │
                 │  - Themed UI (Team Colours)   │
                 └──────────────┬────────────────┘
                                │ HTTPS (REST API + JWT)
                                ▼
    ┌────────────────────────────────────────────────────────┐
    │                    BACKEND API SERVER                  │
    │                 Node.js (NestJS / Express)             │
    │                                                        │
    │  - Authentication (JWT + Refresh)                      │
    │  - User & Team Services                                │
    │  - Football API Integration Layer                      │
    │  - Data Caching / Rate Limiting                        │
    │  - Input Validation & Security Middleware              │
    │                                                        │
    └──────────────┬─────────────────────────────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
      ▼                         ▼
┌────────────────────┐     ┌───────────────────────────┐
│   Database Layer    │     │  External Football API    │
│   PostgreSQL /      │     │ (e.g. API-Football)       │
│   MongoDB           │     │                           │
│ - Users             │     │ - Matches / Fixtures      │
│ - Teams             │     │ - Stats / Standings       │
│ - Preferences       │     │ - Player Data             │
└────────────────────┘     └───────────────────────────┘
```

## Stack Layers

### Frontend Layer

- Angular 19 + Ionic with TypeScript and SCSS
- Charting via Chart.js or ngx-charts
- Responsibilities: responsive UI, authentication, secure API communication, and theming

### Backend Layer

- NestJS (or Express) with TypeScript
- TypeORM or Prisma for persistence
- Responsibilities: JWT auth, football API integration, data transformation, validation, and security middleware (Helmet, CORS, rate limiting)

### Database Layer

- PostgreSQL preferred for structured data; MongoDB acceptable for flexibility
- Example schema: `users`, `teams`, `user_preferences`, plus cache tables

### External API Integration

- Example provider: API-Football
- Backend handles API key, transforms responses, and exposes normalised endpoints to the frontend

## Security Highlights

| Layer | Protection |
|-------|------------|
| Frontend | HTTPS-only calls, token stored in memory/session storage |
| Backend | JWT verification, Helmet, CORS, rate limiting |
| Database | Hashed passwords with bcrypt, restricted connections |
| Auth Flow | Access + refresh token rotation, token expiry handling |

## Deployment & DevOps Considerations

- Hosting: Render, Azure, AWS for backend; Vercel, Netlify, or Azure Static Web Apps for frontend
- CI/CD: GitHub Actions or Azure DevOps
- Database hosting: Neon, Supabase, or Azure Database for PostgreSQL
- Monitoring: LogRocket (frontend), Winston + Datadog (backend)

## Data Flow Summary

1. User action triggers request in Angular frontend.
2. Frontend issues REST call with JWT to backend.
3. Backend authenticates request, fetches data from database or football API.
4. Backend returns sanitised response to frontend for rendering.

## Scalability Notes

- Add Redis caching for football API responses.
- Introduce WebSocket gateway for live match updates.
- Enable horizontal scaling via containers.
- Lazy-load heavy data visualisations on the frontend.
