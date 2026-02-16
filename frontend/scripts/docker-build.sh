#!/bin/bash

# Docker-based build script
# Builds the frontend in a clean Docker environment

set -e

echo "🐳 Docker Build Script for FootDash Frontend"
echo "============================================"

# Configuration
IMAGE_NAME=${IMAGE_NAME:-footdash-frontend-build}
CONTAINER_NAME=${CONTAINER_NAME:-footdash-build-temp}

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

echo -e "${BLUE}Building Docker image...${NC}"
docker build -f Dockerfile.build -t ${IMAGE_NAME} . --target builder

echo ""
echo -e "${BLUE}Extracting build artifacts...${NC}"

# Remove old container if exists
docker rm -f ${CONTAINER_NAME} 2>/dev/null || true

# Create container
docker create --name ${CONTAINER_NAME} ${IMAGE_NAME}

# Copy build output
echo -e "${BLUE}Copying www directory...${NC}"
docker cp ${CONTAINER_NAME}:/app/www ./www

# Cleanup
docker rm ${CONTAINER_NAME}

echo ""
echo -e "${GREEN}✓ Build completed successfully!${NC}"
echo -e "${GREEN}✓ Output: $(pwd)/www${NC}"

# Show build statistics
if [ -d "www" ]; then
  TOTAL_SIZE=$(du -sh www | cut -f1)
  FILE_COUNT=$(find www -type f | wc -l | tr -d ' ')
  
  echo ""
  echo "📊 Build Statistics:"
  echo "  Total Size: ${TOTAL_SIZE}"
  echo "  File Count: ${FILE_COUNT}"
fi
