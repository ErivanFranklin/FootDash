# FootDash (Scaffold)

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
