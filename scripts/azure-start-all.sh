#!/bin/bash
# Start all Azure resources for development

set -e

RESOURCE_GROUP="rg-footdash-dev-eus2"
APP_SERVICE="app-footdash-dev-api-eus2"
PG_SERVER="pg-footdash-dev-eus2"

echo "▶️  Starting Azure resources..."

# Start PostgreSQL
echo "Starting PostgreSQL: $PG_SERVER"
PG_STATE=$(az postgres flexible-server show -g "$RESOURCE_GROUP" -n "$PG_SERVER" --query state -o tsv 2>/dev/null || true)
if [ -z "$PG_STATE" ]; then
	echo "❌ PostgreSQL server '$PG_SERVER' was not found in resource group '$RESOURCE_GROUP'"
	echo "   Create it first or run ./scripts/azure-deploy-all.sh"
	exit 1
fi
if [ "$PG_STATE" = "Stopped" ]; then
	az postgres flexible-server start -g "$RESOURCE_GROUP" -n "$PG_SERVER"
else
	echo "PostgreSQL is already in '$PG_STATE' state, skipping start"
fi

# Start App Service
echo "Starting App Service: $APP_SERVICE"
APP_STATE=$(az webapp show -g "$RESOURCE_GROUP" -n "$APP_SERVICE" --query state -o tsv 2>/dev/null || true)
if [ -z "$APP_STATE" ]; then
	echo "❌ App Service '$APP_SERVICE' was not found in resource group '$RESOURCE_GROUP'"
	echo "   Existing web apps in this group:"
	az webapp list -g "$RESOURCE_GROUP" --query "[].name" -o table || true
	echo "   To recreate expected resources, run: ./scripts/azure-deploy-all.sh"
	exit 1
fi
if [ "$APP_STATE" = "Stopped" ]; then
	az webapp start -g "$RESOURCE_GROUP" -n "$APP_SERVICE"
else
	echo "App Service is already in '$APP_STATE' state, skipping start"
fi

SWA_HOST=$(az staticwebapp show -g "$RESOURCE_GROUP" -n "swa-footdash-dev-eus2" --query defaultHostname -o tsv 2>/dev/null || true)

echo "✅ All resources started and ready for development"
echo "🌐 Backend API: https://$APP_SERVICE.azurewebsites.net"
if [ -n "$SWA_HOST" ]; then
  echo "🌐 Frontend: https://$SWA_HOST"
else
  echo "🌐 Frontend: (Static Web App not found in this resource group)"
fi
