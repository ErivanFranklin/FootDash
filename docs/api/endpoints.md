# API Endpoints (Phase 1 skeleton)

This file lists the main REST endpoints planned for Phase 1 with example request/response shapes. Use this as a reference for implementation and for generating Swagger/OpenAPI later.

## Authentication

### POST /auth/register
Request:
```json
{
  "email": "user@example.com",
  "password": "s3cr3t"
}
```
Response (201):
```json
{
  "id": "uuid",
  "email": "user@example.com"
}
```

### POST /auth/login
Request:
```json
{
  "email": "user@example.com",
  "password": "s3cr3t"
}
```
Response (200):
```json
{
  "accessToken": "ey...",
  "refreshToken": "rfr...",
  "expiresIn": 3600
}
```

### POST /auth/refresh
Request:
```json
{ "refreshToken": "rfr..." }
```
Response:
```json
{ "accessToken": "ey...", "expiresIn": 3600 }
```

## Teams & Matches

### GET /teams/:id
Response:
```json
{
  "id": 33,
  "name": "FC Example",
  "stadium": "Example Arena",
  "colors": { "primary": "#0044cc" }
}
```

### GET /matches?teamId=:teamId
Response:
```json
[
  {
    "id": 12345,
    "homeTeam": { "id": 33, "name": "FC Example" },
    "awayTeam": { "id": 44, "name": "Rivals FC" },
    "kickoff": "2025-11-10T19:45:00Z",
    "score": { "home": 2, "away": 1 }
  }
]
```

### GET /stats/:teamId
Response (summary stats):
```json
{
  "teamId": 33,
  "wins": 12,
  "draws": 5,
  "losses": 3,
  "goalsFor": 36,
  "goalsAgainst": 18
}
```

## Notes
- Add pagination & filtering for list endpoints.
- Protect write endpoints with role checks (Admin).
- Later: auto-generate OpenAPI docs (Swagger) from controllers (e.g., NestJS @nestjs/swagger).
