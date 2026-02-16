#!/bin/bash

# Optimized build script for FootDash frontend
# This script provides performance optimizations and build caching

set -e

echo "🚀 FootDash Optimized Build Script"
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NODE_MEMORY=${NODE_MEMORY:-8192}
BUILD_CONFIG=${BUILD_CONFIG:-production}
ENABLE_CACHE=${ENABLE_CACHE:-true}

echo -e "${BLUE}Configuration:${NC}"
echo "  Node Memory: ${NODE_MEMORY} MB"
echo "  Build Config: ${BUILD_CONFIG}"
echo "  Build Cache: ${ENABLE_CACHE}"
echo ""

# Set Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=${NODE_MEMORY}"

# Enable persistent build cache
if [ "$ENABLE_CACHE" = "true" ]; then
  export NG_PERSISTENT_BUILD_CACHE=1
  echo -e "${GREEN}✓${NC} Build cache enabled"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo -e "${YELLOW}⚠${NC} node_modules not found. Installing dependencies..."
  npm ci --prefer-offline
fi

# Clean previous build
if [ -d "www" ]; then
  echo -e "${BLUE}🗑${NC}  Cleaning previous build..."
  rm -rf www
fi

# Build command options
BUILD_OPTS="--configuration=${BUILD_CONFIG}"

# Note: Angular CLI doesn't have a --parallel flag
# Parallel compilation is automatic based on CPU cores

# Start build timer
START_TIME=$(date +%s)

echo ""
echo -e "${BLUE}🔨 Starting build...${NC}"
echo ""

# Run the build
if npm run build -- ${BUILD_OPTS}; then
  END_TIME=$(date +%s)
  BUILD_TIME=$((END_TIME - START_TIME))
  
  echo ""
  echo -e "${GREEN}✓ Build completed successfully!${NC}"
  echo ""
  
  # Display build statistics
  if [ -d "www" ]; then
    TOTAL_SIZE=$(du -sh www | cut -f1)
    FILE_COUNT=$(find www -type f | wc -l | tr -d ' ')
    
    echo "📊 Build Statistics:"
    echo "  Total Size: ${TOTAL_SIZE}"
    echo "  File Count: ${FILE_COUNT}"
    echo "  Build Time: ${BUILD_TIME}s"
    echo ""
    
    # Show largest files
    echo "📦 Largest bundles:"
    find www -name "*.js" -type f -exec ls -lh {} \; | awk '{print $5, $9}' | sort -hr | head -5
    echo ""
  fi
  
  echo -e "${GREEN}✓ Output directory: $(pwd)/www${NC}"
  exit 0
else
  echo ""
  echo -e "${RED}✗ Build failed!${NC}"
  exit 1
fi
