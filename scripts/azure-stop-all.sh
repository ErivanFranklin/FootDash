#!/bin/bash
# Stop all Azure resources to reduce costs to €0

set -e

RESOURCE_GROUP="rg-footdash-dev-eus2"
APP_SERVICE="app-footdash-dev-api-eus2"
PG_SERVER="pg-footdash-dev-eus2"

echo "🛑 Stopping Azure resources to reduce costs..."

# Stop App Service (saves ~€0.60/month)
echo "Stopping App Service: $APP_SERVICE"
az webapp stop -g "$RESOURCE_GROUP" -n "$APP_SERVICE"

# Stop PostgreSQL (saves ~€5-10/month)
echo "Stopping PostgreSQL: $PG_SERVER"
az postgres flexible-server stop -g "$RESOURCE_GROUP" -n "$PG_SERVER"

echo "✅ All resources stopped. Daily cost: ~€0.00"
echo ""
echo "💡 Note: Container Registry (ACR) cannot be stopped but is the main cost (€0.98/day)."
echo "   To eliminate ACR costs, delete it and recreate when needed:"
echo "   az acr delete -g $RESOURCE_GROUP -n acrfootdashdeveus2 --yes"
echo ""
echo "To restart everything, run: ./scripts/azure-start-all.sh"
