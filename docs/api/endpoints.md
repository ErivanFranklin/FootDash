openapi: 3.0.3
info:
  title: FootDash API
  description: Football/soccer dashboard API for teams, matches, and statistics
  version: 1.0.0
  contact:
    name: FootDash Development Team

servers:
  - url: http://localhost:3000/api
    description: Local development server
  - url: https://api.footdash.com/v1
    description: Production server

security:
  - bearerAuth: []

paths:
  /auth/register:
    post:
      summary: Register a new user
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  minLength: 8
                  example: s3cr3t123
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                    format: uuid
                    example: 550e8400-e29b-41d4-a716-446655440000
                  email:
                    type: string
                    format: email
                    example: user@example.com
        '400':
          description: Invalid input data
        '409':
          description: User already exists

  /auth/login:
    post:
      summary: Authenticate user and get tokens
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                  format: email
                  example: user@example.com
                password:
                  type: string
                  example: s3cr3t123
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  refreshToken:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  expiresIn:
                    type: integer
                    example: 3600
        '401':
          description: Invalid credentials

  /auth/refresh:
    post:
      summary: Refresh access token
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - refreshToken
              properties:
                refreshToken:
                  type: string
                  example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      responses:
        '200':
          description: Token refreshed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                    example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                  expiresIn:
                    type: integer
                    example: 3600
        '401':
          description: Invalid refresh token

  /teams/{id}:
    get:
      summary: Get team details by ID
      tags:
        - Teams
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: integer
            example: 33
      responses:
        '200':
          description: Team details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Team'
        '404':
          description: Team not found

  /matches:
    get:
      summary: Get matches with optional filtering
      tags:
        - Matches
      parameters:
        - name: teamId
          in: query
          schema:
            type: integer
            example: 33
          description: Filter matches by team ID
        - name: limit
          in: query
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20
          description: Maximum number of matches to return
        - name: offset
          in: query
          schema:
            type: integer
            minimum: 0
            default: 0
          description: Number of matches to skip
      responses:
        '200':
          description: List of matches
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Match'

  /stats/{teamId}:
    get:
      summary: Get team statistics
      tags:
        - Statistics
      parameters:
        - name: teamId
          in: path
          required: true
          schema:
            type: integer
            example: 33
      responses:
        '200':
          description: Team statistics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TeamStats'
        '404':
          description: Team not found

components:
  schemas:
    Team:
      type: object
      properties:
        id:
          type: integer
          example: 33
        name:
          type: string
          example: FC Example
        stadium:
          type: string
          example: Example Arena
        colors:
          type: object
          properties:
            primary:
              type: string
              example: "#0044cc"
            secondary:
              type: string
              example: "#ffffff"

    Match:
      type: object
      properties:
        id:
          type: integer
          example: 12345
        homeTeam:
          $ref: '#/components/schemas/TeamSummary'
        awayTeam:
          $ref: '#/components/schemas/TeamSummary'
        kickoff:
          type: string
          format: date-time
          example: "2025-11-10T19:45:00Z"
        score:
          type: object
          properties:
            home:
              type: integer
              example: 2
            away:
              type: integer
              example: 1
          nullable: true

    TeamSummary:
      type: object
      properties:
        id:
          type: integer
          example: 33
        name:
          type: string
          example: FC Example

    TeamStats:
      type: object
      properties:
        teamId:
          type: integer
          example: 33
        wins:
          type: integer
          example: 12
        draws:
          type: integer
          example: 5
        losses:
          type: integer
          example: 3
        goalsFor:
          type: integer
          example: 36
        goalsAgainst:
          type: integer
          example: 18

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
