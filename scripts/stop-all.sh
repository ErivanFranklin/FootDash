#!/bin/bash

# Stop All FootDash Services Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}                    🛑 Stopping FootDash Application                         ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

stop_port() {
	local port="$1"
	local label="$2"
	local pids
	pids=$(lsof -ti:"${port}" 2>/dev/null || true)
	if [ -n "$pids" ]; then
		echo "$pids" | xargs kill -TERM 2>/dev/null || true
		sleep 1
		pids=$(lsof -ti:"${port}" 2>/dev/null || true)
		if [ -n "$pids" ]; then
			echo "$pids" | xargs kill -KILL 2>/dev/null || true
		fi
		echo -e "${GREEN}✓${NC} ${label} stopped (port ${port})"
	else
		echo -e "${YELLOW}⚠${NC}  ${label} not running on port ${port}"
	fi
}

# Stop Frontend
echo -e "${BLUE}[1/4]${NC} Stopping Frontend..."
stop_port 4200 "Frontend"
pkill -f "ng serve" 2>/dev/null || true

# Stop Backend
echo -e "${BLUE}[2/4]${NC} Stopping Backend..."
stop_port 3000 "Backend"
pkill -f "node.*backend.*start:dev" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
pkill -f "npm run start:dev --prefix backend" 2>/dev/null || true

# Stop Docker Containers
echo -e "${BLUE}[3/4]${NC} Stopping Docker Containers..."
stopped_any=0
if docker ps --format '{{.Names}}' | grep -q '^footdash-postgres-local$'; then
	docker stop footdash-postgres-local >/dev/null 2>&1 || true
	stopped_any=1
fi
if docker ps --format '{{.Names}}' | grep -q '^footdash-redis-local$'; then
	docker stop footdash-redis-local >/dev/null 2>&1 || true
	stopped_any=1
fi

if [ "$stopped_any" -eq 1 ]; then
	echo -e "${GREEN}✓${NC} Docker containers stopped"
else
	echo -e "${YELLOW}⚠${NC}  FootDash containers were not running"
fi

# Clean up log files
echo -e "${BLUE}[4/4]${NC} Cleaning up logs..."
rm -f /tmp/footdash-backend.log /tmp/footdash-frontend.log
echo -e "${GREEN}✓${NC} Logs cleaned"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                    ✓ All Services Stopped                                  ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
