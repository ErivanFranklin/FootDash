#!/bin/bash
# Start local development environment

set -e

echo "🚀 Starting FootDash Local Development Environment"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop first."
  exit 1
fi

# Start Docker services
echo "📦 Starting PostgreSQL and Redis containers..."
docker-compose -f docker-compose.local.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
  if docker exec footdash-postgres-local pg_isready -U footdash_user > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ PostgreSQL failed to start within 30 seconds"
    exit 1
  fi
  sleep 1
done

# Copy environment variables
if [ ! -f backend/.env ]; then
  echo "📝 Creating backend/.env from .env.local..."
  cp .env.local backend/.env
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
  echo "📦 Installing backend dependencies..."
  cd backend && npm install && cd ..
fi

# Run migrations
echo "🔄 Running database migrations..."
cd backend && npm run migrate:run || echo "⚠️  Migration failed (tables might already exist)" && cd ..

# Install frontend dependencies if needed
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Local development environment is ready!"
echo ""
echo "📍 Services:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis:      localhost:6379"
echo ""
echo "🎯 Next steps:"
echo "   1. Start backend:  cd backend && npm run start:dev"
echo "   2. Start frontend: cd frontend && npm start"
echo ""
echo "🛑 To stop services: ./scripts/local-dev-stop.sh"
