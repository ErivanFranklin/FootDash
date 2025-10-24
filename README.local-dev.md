# Local development (no Docker)

This file shows minimal, copy-paste commands to run the FootDash backend and frontend locally without Docker. Use this for fast development and lightweight production preview.

---
Prerequisites
- macOS (zsh)
- Node.js (v18+ / v20 recommended)
- npm
- Optional: nvm, pm2, serve/http-server

Install nvm (optional, recommended):
```bash
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 20
nvm use 20
node -v
```

1) Start backend (dev)
```bash
# from project root
cd /Users/erivansilva/Documents/FootDash/backend
npm ci
# create a minimal .env if you don't have one
cat > .env <<EOF
PORT=3001
JWT_SECRET=your_secret_here
EOF

# development with auto-restart
npm run dev
# or start once
# npm start
```
Notes:
- Backend `package.json` already contains `dev` (nodemon) and `start` scripts.
- Default port used here is `3001`; change via `.env` as needed.

2) Start frontend (dev server, live reload)
```bash
# from project root
cd /Users/erivansilva/Documents/FootDash/frontend
npm ci

# If this is an Ionic project (preferred for Ionic features):
npx ionic serve --host=0.0.0.0 --port=8100

# OR use Angular CLI directly:
# npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json
```
Use the project's `proxy.conf.json` so API calls to `/api` are proxied to the backend port (e.g. http://localhost:3001).

3) Quick production preview (static build + tiny static server)
```bash
cd /Users/erivansilva/Documents/FootDash/frontend
npm ci
# Build production bundle (adjust command if your package.json uses a different script)
npm run build

# Serve the build folder with `serve` (install if needed)
npm install -g serve
# Determine build output folder (commonly under dist/). Replace `dist/your-app` below.
serve -s dist/your-app -l 3000

# Alternatively, use http-server via npx
npx http-server dist/your-app -p 3000
```
Now static UI is at `http://localhost:3000`. Point client API base URLs to `http://localhost:3001` (the backend).

4) Run backend as a background process (pm2)
```bash
npm install -g pm2
cd /Users/erivansilva/Documents/FootDash/backend
pm ci
pm2 start index.js --name footdash-backend
pm2 logs footdash-backend
pm2 save
```

5) Helpful notes and troubleshooting
- If ports conflict, change `PORT` in `.env` for backend or change frontend serve port.
- If you get CORS errors when serving static build from `serve`, either:
  - Update frontend fetch base URL to `http://localhost:3001`, or
  - Enable CORS in backend (it appears `cors` is already a dependency).
- To stop dev servers: Ctrl+C in the terminal. To stop pm2: `pm2 stop footdash-backend`.

6) Automation (optional)
Add these scripts to a top-level `Makefile` or `package.json` scripts to make starting/stopping repeatable. Example `Makefile` targets:
```makefile
start-backend:
	cd backend && npm ci && npm run dev

start-frontend:
	cd frontend && npm ci && npx ionic serve --host=0.0.0.0 --port=8100
```

---
If you want, I can run the backend and frontend locally in this environment now, or add these scripts to the repo. Tell me which you prefer.

---
Running only the DB in a lightweight container (Colima + Docker Compose)

If Docker Desktop is too heavy and you only want a DB container running, you can use Colima (Lima-based lightweight VM) and a DB-only compose file we include.

1) Install Colima (if you don't have it):
```bash
# Homebrew (recommended)
brew install colima
brew install docker
```

2) Start the DB service (this will start Colima and run postgres in a container):
```bash
./scripts/start-db.sh
```
This uses `docker-compose.db.yml` in the project root and starts a Postgres 15 container with a persistent volume. The DB will be available on `localhost:5432` for host processes (your local backend).

3) Notes on connecting your local backend/frontend
- When running the backend on your host (not in Docker), use `localhost:5432` as the DB host.
- If you later run the backend in Docker, set DB_HOST to `db` (the service name) so Docker networking resolves it.

4) Stop the DB
```bash
docker compose -f docker-compose.db.yml down
```

This pattern keeps backend and frontend running on your machine without container isolation while keeping the database in a lightweight Colima VM/container.