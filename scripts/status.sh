#!/bin/bash

# Check FootDash Application Status

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                    📊 FootDash Application Status                          ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Docker
echo -e "${BLUE}🐳 Docker:${NC}"
if docker info > /dev/null 2>&1; then
  echo -e "   ${GREEN}✓${NC} Running"
else
  echo -e "   ${RED}✗${NC} Not running"
fi
echo ""

# Check PostgreSQL
echo -e "${BLUE}🗄  PostgreSQL:${NC}"
if docker ps | grep footdash-postgres-local > /dev/null 2>&1; then
  if docker exec footdash-postgres-local pg_isready -U footdash_user > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Running on localhost:5432"
  else
    echo -e "   ${YELLOW}⚠${NC}  Container running but not ready"
  fi
else
  echo -e "   ${RED}✗${NC} Not running"
fi
echo ""

# Check Redis
echo -e "${BLUE}🔴 Redis:${NC}"
if docker ps | grep footdash-redis-local > /dev/null 2>&1; then
  if docker exec footdash-redis-local redis-cli ping > /dev/null 2>&1; then
    echo -e "   ${GREEN}✓${NC} Running on localhost:6379"
  else
    echo -e "   ${YELLOW}⚠${NC}  Container running but not ready"
  fi
else
  echo -e "   ${RED}✗${NC} Not running"
fi
echo ""

# Check Backend
echo -e "${BLUE}⚙️  Backend API:${NC}"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
  HEALTH=$(curl -s http://localhost:3000/api/health | grep -o '"status":"ok"')
  if [ -n "$HEALTH" ]; then
    echo -e "   ${GREEN}✓${NC} Running on http://localhost:3000"
    echo -e "   ${GREEN}✓${NC} Health check: OK"
  else
    echo -e "   ${YELLOW}⚠${NC}  Running but health check failed"
  fi
else
  if pgrep -f "node.*backend.*start:dev" > /dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠${NC}  Process running but not responding"
  else
    echo -e "   ${RED}✗${NC} Not running"
  fi
fi
echo ""

# Check Frontend
echo -e "${BLUE}🎨 Frontend:${NC}"
if curl -s http://localhost:4200 > /dev/null 2>&1; then
  echo -e "   ${GREEN}✓${NC} Running on http://localhost:4200"
else
  if pgrep -f "ng serve" > /dev/null 2>&1; then
    echo -e "   ${YELLOW}⚠${NC}  Process running but not responding yet"
  else
    echo -e "   ${RED}✗${NC} Not running"
  fi
fi
echo ""

# Process Information
echo -e "${BLUE}📊 Process Information:${NC}"

BACKEND_PID=$(pgrep -f "node.*backend.*start:dev" | head -1)
if [ -n "$BACKEND_PID" ]; then
  echo "   Backend PID: $BACKEND_PID"
fi

FRONTEND_PID=$(pgrep -f "ng serve" | head -1)
if [ -n "$FRONTEND_PID" ]; then
  echo "   Frontend PID: $FRONTEND_PID"
fi
echo ""

# Quick Links
echo -e "${BLUE}🔗 Quick Links:${NC}"
echo "   Frontend:     http://localhost:4200"
echo "   Backend API:  http://localhost:3000/api"
echo "   API Docs:     http://localhost:3000/api/docs"
echo "   Health Check: http://localhost:3000/api/health"
echo ""

# Logs
echo -e "${BLUE}📝 View Logs:${NC}"
if [ -f /tmp/footdash-backend.log ]; then
  echo "   Backend:  tail -f /tmp/footdash-backend.log"
fi
if [ -f /tmp/footdash-frontend.log ]; then
  echo "   Frontend: tail -f /tmp/footdash-frontend.log"
fi
echo ""
