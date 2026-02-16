# Production-ready Dockerfile for NestJS backend
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src
COPY migrations ./migrations
COPY scripts ./scripts
COPY data-source.ts ./

# Build
RUN npm run build

# Runtime image
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=80

# Install required runtime dependencies
RUN apk add --no-cache tini

# Copy only what's needed to run
COPY --from=base /app/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=base /app/dist ./dist
COPY --from=base /app/data-source.ts ./
COPY --from=base /app/migrations ./migrations
COPY --from=base /app/scripts ./scripts
COPY --from=base /app/tsconfig*.json ./

EXPOSE 80

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]
