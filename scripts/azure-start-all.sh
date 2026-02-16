#!/bin/bash
# Start all Azure resources for development

set -e

RESOURCE_GROUP="rg-footdash-dev-eus2"
APP_SERVICE="app-footdash-dev-api-eus2"
PG_SERVER="pg-footdash-dev-eus2"

echo "▶️  Starting Azure resources..."

# Start PostgreSQL
echo "Starting PostgreSQL: $PG_SERVER"
az postgres flexible-server start -g "$RESOURCE_GROUP" -n "$PG_SERVER"

# Start App Service
echo "Starting App Service: $APP_SERVICE"
az webapp start -g "$RESOURCE_GROUP" -n "$APP_SERVICE"

echo "✅ All resources started and ready for development"
echo "🌐 Backend API: https://$APP_SERVICE.azurewebsites.net"
echo "🌐 Frontend: https://swa-footdash-dev-eus2.azurestaticapps.net"
