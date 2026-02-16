#!/bin/bash
# Complete workflow: Build, deploy, and start all Azure resources from scratch

set -e

RESOURCE_GROUP="rg-footdash-dev-eus2"
LOCATION="eastus2"
ACR_NAME="acrfootdashdeveus2"
APP_SERVICE_PLAN="asp-footdash-dev-eus2"
APP_SERVICE="app-footdash-dev-api-eus2"
PG_SERVER="pg-footdash-dev-eus2"
KEY_VAULT="kv-footdash-dev-eus2"
SWA_NAME="swa-footdash-dev-eus2"

echo "🚀 Starting complete Azure deployment..."
echo ""

# Check if resources exist
echo "Checking if resources already exist..."
RG_EXISTS=$(az group exists -n "$RESOURCE_GROUP")

if [ "$RG_EXISTS" == "true" ]; then
  echo "✅ Resource group exists. Starting existing resources..."
  
  # Start PostgreSQL if stopped
  echo "Starting PostgreSQL..."
  az postgres flexible-server start -g "$RESOURCE_GROUP" -n "$PG_SERVER" 2>/dev/null || echo "PostgreSQL already running"
  
  # Start App Service if stopped
  echo "Starting App Service..."
  az webapp start -g "$RESOURCE_GROUP" -n "$APP_SERVICE" 2>/dev/null || echo "App Service already running"
  
  # Check if ACR exists
  ACR_EXISTS=$(az acr show -g "$RESOURCE_GROUP" -n "$ACR_NAME" 2>/dev/null || echo "")
  if [ -z "$ACR_EXISTS" ]; then
    echo "⚠️  Container Registry doesn't exist. Creating and building image..."
    ./scripts/azure-recreate-acr.sh
  else
    echo "✅ Container Registry exists"
    
    # Check if image exists
    IMAGE_EXISTS=$(az acr repository show -n "$ACR_NAME" --repository footdash-api 2>/dev/null || echo "")
    if [ -z "$IMAGE_EXISTS" ]; then
      echo "⚠️  Backend image doesn't exist. Building..."
      az acr build --registry "$ACR_NAME" --image footdash-api:dev --file backend/Dockerfile ./backend
    else
      echo "✅ Backend image exists"
    fi
  fi
  
else
  echo "⚠️  Resources don't exist. Run the full infrastructure setup first:"
  echo "   See docs/ops/azure-dev-deployment.md"
  exit 1
fi

echo ""
echo "✅ All resources are running!"
echo ""
echo "📍 Resource URLs:"
echo "   Backend API: https://$APP_SERVICE.azurewebsites.net"
echo "   Frontend: https://$SWA_NAME.azurestaticapps.net"
echo ""
echo "Next steps:"
echo "1. Test your application (see docs/ops/azure-test-guide.md)"
echo "2. When done, run: ./scripts/azure-delete-all.sh"
