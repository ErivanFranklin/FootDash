# Changelog

All notable changes to this project will be documented in this file.A

## Unreleased

- feat: Complete Phase 14.7 RBAC + billing hardening
  - Added persistent user roles (`USER`, `ADMIN`, `MODERATOR`) with `users.role` migration and default backfill
  - Propagated `role` through auth (`register`, `login`, `refresh`), JWT payloads, and `/auth/profile`
  - Added role authorization primitives (`@Roles`, `RolesGuard`) and enforced admin-only access on analytics export endpoints
  - Hardened `AdminGuard` to deny when auth context is missing
  - Added billing endpoints: `GET /payments/subscription`, `GET /payments/history`, `GET /payments/verify-session/:sessionId`
  - Updated payment success flow to verify Stripe session server-side before showing success
  - Extended unit/e2e coverage for auth role propagation and export authorization behavior

- feat: Integrate Swagger/OpenAPI documentation for the NestJS API
  - Swagger UI available at `/api` and OpenAPI JSON at `/api-json`
  - Controllers and DTOs annotated for schema generation
  - JWT bearer auth support exposed in Swagger UI
  - Football API mock mode enabled by default in dev to avoid external credentials
  - Helmet CSP relaxed in development to allow Swagger assets

- CI: tiny changelog tweak to re-trigger PR checks

Notes:
- This entry was added on 2025-11-06 and is included in the feature branch `feature/swagger-integration`.
