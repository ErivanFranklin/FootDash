#!/bin/bash

# Bundle Analysis Script
# Analyzes the built application to identify optimization opportunities

set -e

echo "📊 FootDash Bundle Analysis"
echo "============================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if build exists
if [ ! -d "www" ]; then
  echo -e "${RED}❌ Build directory 'www' not found.${NC}"
  echo "Run 'npm run build' first."
  exit 1
fi

echo -e "${BLUE}📦 Total Bundle Size:${NC}"
du -sh www
echo ""

echo -e "${BLUE}📁 Directory Breakdown:${NC}"
du -sh www/* | sort -hr
echo ""

echo -e "${BLUE}🔍 Top 10 Largest JavaScript Files:${NC}"
find www -name "*.js" -type f -exec ls -lh {} \; | \
  awk '{print $5 "\t" $9}' | \
  sort -hr | \
  head -10 | \
  awk '{print "  " $1 "\t" $2}'
echo ""

echo -e "${BLUE}🎨 Top 5 Largest CSS Files:${NC}"
find www -name "*.css" -type f -exec ls -lh {} \; | \
  awk '{print $5 "\t" $9}' | \
  sort -hr | \
  head -5 | \
  awk '{print "  " $1 "\t" $2}'
echo ""

# Count files by type
JS_COUNT=$(find www -name "*.js" -type f | wc -l | tr -d ' ')
CSS_COUNT=$(find www -name "*.css" -type f | wc -l | tr -d ' ')
HTML_COUNT=$(find www -name "*.html" -type f | wc -l | tr -d ' ')
IMG_COUNT=$(find www -name "*.png" -o -name "*.jpg" -o -name "*.svg" -o -name "*.webp" | wc -l | tr -d ' ')

echo -e "${BLUE}📈 File Count by Type:${NC}"
echo "  JavaScript files: ${JS_COUNT}"
echo "  CSS files: ${CSS_COUNT}"
echo "  HTML files: ${HTML_COUNT}"
echo "  Images: ${IMG_COUNT}"
echo ""

# Analyze chunk sizes
echo -e "${BLUE}🧩 Lazy-Loaded Chunks:${NC}"
CHUNK_COUNT=$(find www -name "chunk-*.js" -type f | wc -l | tr -d ' ')
echo "  Total chunks: ${CHUNK_COUNT}"

if [ $CHUNK_COUNT -gt 0 ]; then
  AVG_CHUNK_SIZE=$(find www -name "chunk-*.js" -type f -exec ls -l {} \; | \
    awk '{sum+=$5; count++} END {if(count>0) print int(sum/count/1024) "KB"}')
  echo "  Average chunk size: ${AVG_CHUNK_SIZE}"
fi
echo ""

# Check for source maps (should not be in production)
SOURCEMAP_COUNT=$(find www -name "*.map" -type f | wc -l | tr -d ' ')
if [ $SOURCEMAP_COUNT -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Warning: ${SOURCEMAP_COUNT} source map files found${NC}"
  echo "   Source maps should not be included in production builds"
  echo ""
fi

# Recommendations
echo -e "${GREEN}💡 Optimization Recommendations:${NC}"
echo ""

# Check for large files
LARGE_FILES=$(find www -name "*.js" -type f -size +200k | wc -l | tr -d ' ')
if [ $LARGE_FILES -gt 0 ]; then
  echo -e "${YELLOW}  ⚠ ${LARGE_FILES} JavaScript files larger than 200KB found${NC}"
  echo "     Consider code-splitting or lazy-loading these modules"
fi

# Check for uncompressed files
if [ ! -f "www/index.html.gz" ]; then
  echo -e "${YELLOW}  ⚠ No gzip compression detected${NC}"
  echo "     Enable gzip compression on your web server"
fi

# Check for images
LARGE_IMAGES=$(find www -type f \( -name "*.png" -o -name "*.jpg" \) -size +100k | wc -l | tr -d ' ')
if [ $LARGE_IMAGES -gt 0 ]; then
  echo -e "${YELLOW}  ⚠ ${LARGE_IMAGES} images larger than 100KB${NC}"
  echo "     Consider using WebP format and/or optimizing images"
fi

echo ""
echo -e "${GREEN}✓ Analysis complete${NC}"
