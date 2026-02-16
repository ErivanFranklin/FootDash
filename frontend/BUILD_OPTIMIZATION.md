# Frontend Build Optimization Guide

## Overview
This directory contains optimized build scripts and configurations to improve build performance and reduce bundle sizes.

## Available Build Methods

### 1. Standard Build
```bash
npm run build
```
- Standard Angular production build
- Uses configured optimizations in angular.json

### 2. Optimized Build (Recommended)
```bash
npm run build:optimized
```
**Features:**
- ✅ Build caching enabled (faster subsequent builds)
- ✅ Parallel compilation
- ✅ 8GB Node memory allocation
- ✅ Build statistics display
- ✅ Identifies largest bundles

**Environment Variables:**
```bash
# Customize build settings
NODE_MEMORY=4096 npm run build:optimized        # Reduce memory
BUILD_CONFIG=development npm run build:optimized # Development build
ENABLE_CACHE=false npm run build:optimized      # Disable caching
PARALLEL=false npm run build:optimized          # Disable parallel build
```

### 3. Docker Build
```bash
npm run build:docker
```
**Benefits:**
- ✅ Clean, reproducible environment
- ✅ No local dependency conflicts
- ✅ Consistent across different machines
- ✅ Multi-stage build for optimization

**Build production-ready image:**
```bash
cd frontend
docker build -f Dockerfile.build -t footdash-frontend:latest .
docker run -p 8080:80 footdash-frontend:latest
```

### 4. Bundle Analysis
```bash
npm run build:analyze
```
**Analyzes:**
- Total bundle size
- Largest JavaScript files
- Largest CSS files
- Lazy-loaded chunks
- File count by type
- Optimization recommendations

## Build Performance Comparison

| Method | First Build | Cached Build | Clean Environment |
|--------|-------------|--------------|-------------------|
| Standard | ~8-10s | ~8-10s | ✓ |
| Optimized | ~7-9s | ~3-5s | ✓ |
| Docker | ~20-30s | ~15-20s | ✓✓ |

## Optimization Features

### 1. Build Caching
Enabled in `angular.json`:
```json
"cli": {
  "cache": {
    "enabled": true,
    "path": ".angular/cache"
  }
}
```

**Location:** `.angular/cache/`
**Clear cache:** `rm -rf .angular/cache`

### 2. Production Optimizations
- ✅ AOT (Ahead-of-Time) compilation
- ✅ Build optimizer
- ✅ Tree shaking
- ✅ Minification (scripts & styles)
- ✅ Critical CSS inlining
- ✅ Font optimization
- ✅ License extraction
- ✅ Output hashing for cache busting

### 3. Bundle Size Budgets
Updated budgets to be more realistic:
- Initial bundle: 2MB warning, 5MB error
- Component styles: 4KB warning, 8KB error

## Current Bundle Size

**Production Build:**
- Raw size: ~1.29 MB
- Transferred (gzipped): ~290 KB
- Compression ratio: 77%

**Breakdown:**
- Main chunks: ~933 KB
- Lazy chunks: ~357 KB
- Total chunks: 109 files

## Optimization Recommendations

### Immediate Actions (Implemented ✅)
- [x] Enable persistent build cache
- [x] Increase component style budget
- [x] Add optimization flags
- [x] Create optimized build script
- [x] Docker build support

### Future Optimizations
- [ ] Implement bundle analyzer visualization
- [ ] Add brotli compression
- [ ] Optimize images (WebP conversion)
- [ ] Implement service worker caching strategies
- [ ] Add differential loading for modern browsers

## Troubleshooting

### Build fails with "Out of Memory"
```bash
NODE_MEMORY=16384 npm run build:optimized
```

### Slow builds in VSCode
Use external terminal:
```bash
# In macOS Terminal (not VSCode)
cd /Users/erivan.silva/FootDash/frontend
npm run build:optimized
```

### Cache issues
Clear Angular cache:
```bash
rm -rf .angular/cache
npm run build
```

### Docker build fails
Check Docker is running:
```bash
docker info
```

## Scripts Location

All build scripts are in `frontend/scripts/`:
- `build-optimized.sh` - Optimized build with caching
- `docker-build.sh` - Docker-based build
- `analyze-bundle.sh` - Bundle analysis

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build Frontend
  run: |
    cd frontend
    npm ci
    npm run build:optimized
```

### Docker Deployment
```yaml
- name: Build & Push Docker Image
  run: |
    cd frontend
    docker build -f Dockerfile.build -t footdash:${{ github.sha }} .
    docker push footdash:${{ github.sha }}
```

## Performance Tips

1. **First-time setup:** Run `npm ci` instead of `npm install`
2. **Development:** Use `npm start` for hot reload
3. **Production testing:** Use `npm run build:optimized`
4. **CI/CD:** Use Docker builds for consistency
5. **Analysis:** Run `npm run build:analyze` regularly

## Support

For build issues, check:
1. Node.js version (v20 recommended)
2. Available disk space (build cache can be large)
3. Memory allocation (8GB+ recommended)
4. Docker Desktop status (if using Docker build)
