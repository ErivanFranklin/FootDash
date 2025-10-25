# Phase 1 Development Plan (MVP)

> Source: `prompt/004-phase-1-development-plan.md`

## Goal of Phase 1

Build a secure, scalable MVP of the Football Dashboard application with:

- User authentication and team personalization
- Live football data integration
- Themed dashboards with charts and match data
- Fully separated, secure frontend and backend environments
- Responsive web and mobile builds

## Phase 1 Overview

| Phase | Duration | Focus |
|-------|----------|-------|
| Planning & Setup | Week 1–2 | Architecture design, environment setup, API research |
| Backend Foundation | Week 3–5 | Authentication, API integration, database setup |
| Frontend Foundation | Week 6–8 | Angular + Ionic setup, theme system, dashboard components |
| Integration & Testing | Week 9–10 | Connect frontend to backend, secure communication, QA |
| Deployment & Review | Week 11–12 | Cloud deployment, UAT, performance review |

## 1. Planning & Setup (Weeks 1–2)

### Deliverables

- Finalise functional requirements (based on PDD)
- Define data flows and API endpoints
- Choose football data provider (e.g., API-Football)
- Design architecture diagram and authentication flow (JWT + refresh)
- Initialise repositories:
  - `/frontend` → Angular + Ionic project
  - `/backend` → Node.js (NestJS / Express) project
- Set up environment:
  - GitHub for version control
  - Docker for local dev
  - Environment variables for secrets and API keys

### Key Outcomes

- Solid project architecture ready for parallel backend/frontend development
- CI/CD pipeline skeleton (GitHub Actions or Azure DevOps)

## 2. Backend Foundation (Weeks 3–5)

### Deliverables

- Initialise NestJS / Express backend
- Set up database (PostgreSQL preferred)
- Implement authentication:
  - JWT + refresh tokens
  - Password hashing (bcrypt)
  - Role-based access control (User / Admin)
- Integrate football API (fetch teams, standings, latest matches)
- Create REST endpoints:
  - `/auth/register`, `/auth/login`, `/auth/refresh`
  - `/teams/:id`, `/matches/:teamId`, `/stats/:teamId`
- Add validation and sanitisation (class-validator / JOI)
- Enable security middleware:
  - Helmet, CORS, rate limiting
- Add environment variable management (dotenv)
- Unit tests for auth and API integration

### Key Outcomes

- Secure, RESTful backend API
- Live data from football API accessible via endpoints

## 3. Frontend Foundation (Weeks 6–8)

### Deliverables

- Initialise Angular 19 + Ionic project
- Set up SCSS architecture for team-themed design
- Build UI components:
  - Login / Register pages
  - Dashboard layout (shell)
  - Sidebar / topbar with team selection
  - Team stats cards, match list, and chart area
- Integrate Chart.js or ngx-charts for analytics visualisation
- Connect with backend via REST API
- Implement state management (NgRx or RxJS services)
- Configure route guards (AuthGuard)
- Responsive design testing (mobile and web)
- Create base environment configuration (dev / prod)

### Key Outcomes

- Functional user interface with working charts
- User authentication and team-based personalisation

## 4. Integration & Testing (Weeks 9–10)

### Deliverables

- End-to-end integration between frontend and backend
- Secure API calls with tokens and CORS
- Test football API data rendering in charts
- Unit and integration testing (Jest / Karma)
- Manual QA and bug fixes
- Security tests: JWT expiry, token refresh, input validation

### Key Outcomes

- Stable, secure, and responsive MVP
- Verified data flow from football API → backend → frontend

## 5. Deployment & Review (Weeks 11–12)

### Deliverables

- Deploy backend (e.g., Render, Azure App Service)
- Deploy frontend (e.g., Vercel, Firebase Hosting)
- Connect to production database (PostgreSQL on Neon / Supabase / RDS)
- Configure CI/CD pipelines
- Final UAT (user acceptance testing)
- Documentation:
  - Setup guide (README)
  - API reference (Swagger / Postman)
  - Security checklist

### Key Outcomes

- Publicly accessible MVP
- Production-ready deployment with basic monitoring

## MVP Deliverables Summary

| Category | Deliverable |
|----------|-------------|
| Frontend | Angular + Ionic web/mobile app with authentication, dashboard, and themed UI |
| Backend | Node.js API with JWT auth, football API integration, and PostgreSQL DB |
| Security | HTTPS, CORS, Helmet, data validation, JWT refresh flow |
| Deployment | Cloud-hosted backend + frontend with CI/CD |
| Documentation | Architecture diagram, API docs, deployment guide |

## Next Phase (Phase 2 – Post-MVP Preview)

- WebSocket real-time updates
- Push notifications (Firebase Cloud Messaging)
- Admin dashboard for engagement metrics
- User profile preferences (multiple teams, favourite players)
- AI-driven match insights or predictions
