# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- feat: Integrate Swagger/OpenAPI documentation for the NestJS API
  - Swagger UI available at `/api` and OpenAPI JSON at `/api-json`
  - Controllers and DTOs annotated for schema generation
  - JWT bearer auth support exposed in Swagger UI
  - Football API mock mode enabled by default in dev to avoid external credentials
  - Helmet CSP relaxed in development to allow Swagger assets

Notes:
- This entry was added on 2025-11-06 and is included in the feature branch `feature/swagger-integration`.
