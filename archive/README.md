# Archive Directory

This directory contains archived code from previous phases of the FootDash project.

## `backend-legacy/`

The original Express.js backend implementation, archived after Phase B completion.

- **Archive Date**: January 2025
- **Last Working Version**: See tag `v1.0.0-legacy-backend`
- **Reason for Archive**: Fully replaced by the NestJS backend (`backend-nest/`)
- **Status**: No longer maintained, kept for historical reference

### Key Features (Historical)

The legacy backend provided:
- JWT authentication (register, login, refresh, logout)
- User management
- Match and team data integration with football-data.org API
- Basic REST API endpoints

All functionality has been migrated to the NestJS backend with:
- Better type safety (TypeScript)
- Improved architecture (modules, dependency injection)
- Enhanced testing (e2e test coverage)
- Better documentation (Swagger/OpenAPI)

### Reference

If you need to reference the legacy implementation:
```bash
# View the last working version
git checkout v1.0.0-legacy-backend

# Compare with current implementation
git diff v1.0.0-legacy-backend:backend/ main:backend/
```

---

For current development, see `backend/` directory and the main project README.
