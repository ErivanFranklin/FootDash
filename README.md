# FootDash (Scaffold)

[![Backend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)
[![Frontend CI](https://github.com/ErivanFranklin/FootDash/actions/workflows/frontend-ci.yml/badge.svg)](https://github.com/ErivanFranklin/FootDash/actions)

This repository contains initial scaffold for the Football Dashboard project.

Services

- backend: Minimal Express API with JWT auth scaffold. Run with `node backend/index.js`.
- frontend: Static example at `frontend/index.html` demonstrating login and protected API calls.
- docker-compose.yml: Local dev composition to run backend, frontend (nginx), and a Postgres DB.

Quick start (local, without Docker)

1. Backend

```bash
cd backend
npm install
npm run start
```

2. Frontend

Open `frontend/index.html` in a browser. It will call the backend at port 4000 by default.

Docker

```bash
docker-compose up --build
```

CI / Troubleshooting

We added CI workflows for backend and frontend under `.github/workflows/`. For troubleshooting and local reproduction steps, see `.github/CI-README.md`.


---

## Local development notes (backend)

The Nest backend supports a mock mode and a default-league fallback to make local development easier:

- FOOTBALL_API_MOCK (boolean): set to `true` to enable mock responses from the Football API adapter so you can run the app without external API credentials.
- FOOTBALL_API_DEFAULT_LEAGUE (number|string): optional default league id used when `leagueId` is omitted from team-stat requests. Strings will be coerced to numbers when possible.

Swagger / OpenAPI for the backend (when running locally) is available at:

- HTML UI: http://localhost:3000/api
- OpenAPI JSON: http://localhost:3000/api-json

