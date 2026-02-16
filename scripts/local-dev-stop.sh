#!/bin/bash
# Stop local development environment

echo "🛑 Stopping FootDash Local Development Environment"

# Stop Docker services
docker-compose -f docker-compose.local.yml down

echo "✅ All services stopped"
echo ""
echo "💡 To remove all data (reset database):"
echo "   docker-compose -f docker-compose.local.yml down -v"
