#!/bin/bash

# Complete FootDash Application Startup Script
# This script starts all necessary services: Database, Redis, Backend API, and Frontend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                    🚀 FootDash Application Startup                         ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Change to project root directory
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

echo -e "${YELLOW}📂 Project Directory: ${PROJECT_ROOT}${NC}"
echo ""

# Step 1: Check Docker is running
echo -e "${BLUE}[1/6]${NC} Checking Docker..."
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker Desktop.${NC}"
  exit 1
fi
echo -e "${GREEN}✓${NC} Docker is running"
echo ""

# Step 2: Start PostgreSQL
echo -e "${BLUE}[2/6]${NC} Starting PostgreSQL..."
docker start footdash-postgres-local 2>/dev/null || \
  docker run -d \
    --name footdash-postgres-local \
    -e POSTGRES_USER=footdash_user \
    -e POSTGRES_PASSWORD=footdash_pass \
    -e POSTGRES_DB=footdash_dev \
    -p 5432:5432 \
    -v postgres_data:/var/lib/postgresql/data \
    postgres:15-alpine

# Wait for PostgreSQL
echo -n "Waiting for PostgreSQL"
for i in {1..30}; do
  if docker exec footdash-postgres-local pg_isready -U footdash_user > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✓${NC} PostgreSQL is ready"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 30 ]; then
    echo ""
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    exit 1
  fi
done
echo ""

# Step 3: Start Redis
echo -e "${BLUE}[3/6]${NC} Starting Redis..."
docker start footdash-redis-local 2>/dev/null || \
  docker run -d \
    --name footdash-redis-local \
    -p 6379:6379 \
    redis:7-alpine

# Wait for Redis
sleep 2
if docker exec footdash-redis-local redis-cli ping > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Redis is ready"
else
  echo -e "${YELLOW}⚠${NC}  Redis may not be ready, but continuing..."
fi
echo ""

# Step 4: Start Backend API
echo -e "${BLUE}[4/6]${NC} Starting Backend API..."

# Kill any existing backend processes
pkill -f "node.*backend.*start:dev" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true

# Create .env file if it doesn't exist
if [ ! -f "${PROJECT_ROOT}/backend/.env" ]; then
  echo "Creating backend .env file..."
  cat > "${PROJECT_ROOT}/backend/.env" << EOF
NODE_ENV=development
PORT=3000
DATABASE_URL=postgres://footdash_user:footdash_pass@localhost:5432/footdash_dev
JWT_SECRET=local-dev-secret-change-in-production
REDIS_URL=redis://localhost:6379
EOF
fi

# Start backend in background
cd "${PROJECT_ROOT}/backend"
echo "Starting NestJS backend..."
npm run start:dev > /tmp/footdash-backend.log 2>&1 &
BACKEND_PID=$!
echo -e "${GREEN}✓${NC} Backend starting (PID: ${BACKEND_PID})"
echo "   Logs: /tmp/footdash-backend.log"

# Wait for backend to be ready
echo -n "Waiting for backend API"
for i in {1..30}; do
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✓${NC} Backend API is ready"
    break
  fi
  echo -n "."
  sleep 2
  if [ $i -eq 30 ]; then
    echo ""
    echo -e "${YELLOW}⚠${NC}  Backend may not be fully ready, check logs: tail -f /tmp/footdash-backend.log"
  fi
done
echo ""

# Step 5: Build Frontend (if not already built)
echo -e "${BLUE}[5/6]${NC} Checking Frontend build..."
cd "${PROJECT_ROOT}/frontend"
if [ ! -d "www" ] || [ ! -f "www/index.html" ]; then
  echo "Building frontend..."
  npm run build
else
  echo -e "${GREEN}✓${NC} Frontend already built"
fi
echo ""

# Step 6: Start Frontend Dev Server
echo -e "${BLUE}[6/6]${NC} Starting Frontend Dev Server..."

# Kill any existing frontend processes
pkill -f "ng serve" 2>/dev/null || true

cd "${PROJECT_ROOT}/frontend"
npm start > /tmp/footdash-frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}✓${NC} Frontend starting (PID: ${FRONTEND_PID})"
echo "   Logs: /tmp/footdash-frontend.log"
echo ""

# Summary
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                    ✓ FootDash Application Started                          ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo "   ✓ PostgreSQL:  localhost:5432"
echo "   ✓ Redis:       localhost:6379"
echo "   ✓ Backend API: http://localhost:3000"
echo "   ✓ Frontend:    http://localhost:4200"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   Backend:  tail -f /tmp/footdash-backend.log"
echo "   Frontend: tail -f /tmp/footdash-frontend.log"
echo ""
echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "   Frontend:     http://localhost:4200"
echo "   Backend API:  http://localhost:3000/api"
echo "   API Docs:     http://localhost:3000/api/docs"
echo ""
echo -e "${BLUE}⏹  To stop all services:${NC}"
echo "   ./scripts/stop-all.sh"
echo ""
echo -e "${YELLOW}⏳ Waiting for frontend server to start (usually takes 10-20 seconds)...${NC}"
echo "   Frontend will be available at: http://localhost:4200"
echo ""
