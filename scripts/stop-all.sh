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

# Stop Frontend
echo -e "${BLUE}[1/4]${NC} Stopping Frontend..."
pkill -f "ng serve" 2>/dev/null && echo -e "${GREEN}✓${NC} Frontend stopped" || echo -e "${YELLOW}⚠${NC}  Frontend not running"

# Stop Backend
echo -e "${BLUE}[2/4]${NC} Stopping Backend..."
pkill -f "node.*backend.*start:dev" 2>/dev/null && echo -e "${GREEN}✓${NC} Backend stopped" || echo -e "${YELLOW}⚠${NC}  Backend not running"
pkill -f "nest start" 2>/dev/null || true

# Stop Docker Containers
echo -e "${BLUE}[3/4]${NC} Stopping Docker Containers..."
docker stop footdash-postgres-local footdash-redis-local 2>/dev/null && echo -e "${GREEN}✓${NC} Docker containers stopped" || echo -e "${YELLOW}⚠${NC}  Containers not running"

# Clean up log files
echo -e "${BLUE}[4/4]${NC} Cleaning up logs..."
rm -f /tmp/footdash-backend.log /tmp/footdash-frontend.log
echo -e "${GREEN}✓${NC} Logs cleaned"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}                    ✓ All Services Stopped                                  ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
