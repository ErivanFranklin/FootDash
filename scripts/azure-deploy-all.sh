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

  # Ensure App Service plan exists
  PLAN_EXISTS=$(az appservice plan show -g "$RESOURCE_GROUP" -n "$APP_SERVICE_PLAN" 2>/dev/null || echo "")
  if [ -z "$PLAN_EXISTS" ]; then
    echo "⚠️  App Service Plan missing. Creating: $APP_SERVICE_PLAN"
    az appservice plan create -n "$APP_SERVICE_PLAN" -g "$RESOURCE_GROUP" --is-linux --sku B1
  else
    echo "✅ App Service Plan exists"
  fi

  # Ensure App Service exists
  APP_EXISTS=$(az webapp show -g "$RESOURCE_GROUP" -n "$APP_SERVICE" 2>/dev/null || echo "")
  if [ -z "$APP_EXISTS" ]; then
    echo "⚠️  App Service missing. Creating: $APP_SERVICE"
    az webapp create -n "$APP_SERVICE" -g "$RESOURCE_GROUP" --plan "$APP_SERVICE_PLAN" \
      --deployment-container-image-name nginx:latest
  else
    echo "✅ App Service exists"
  fi
  
  # Start PostgreSQL if stopped
  echo "Starting PostgreSQL..."
  PG_STATE=$(az postgres flexible-server show -g "$RESOURCE_GROUP" -n "$PG_SERVER" --query state -o tsv 2>/dev/null || true)
  if [ -z "$PG_STATE" ]; then
    echo "❌ PostgreSQL server '$PG_SERVER' was not found in '$RESOURCE_GROUP'"
    echo "   Create it first (see docs/ops/azure-dev-deployment.md)"
    exit 1
  elif [ "$PG_STATE" = "Stopped" ]; then
    az postgres flexible-server start -g "$RESOURCE_GROUP" -n "$PG_SERVER"
  else
    echo "PostgreSQL already in '$PG_STATE' state"
  fi
  
  # Start App Service if stopped
  echo "Starting App Service..."
  APP_STATE=$(az webapp show -g "$RESOURCE_GROUP" -n "$APP_SERVICE" --query state -o tsv 2>/dev/null || true)
  if [ "$APP_STATE" = "Stopped" ]; then
    az webapp start -g "$RESOURCE_GROUP" -n "$APP_SERVICE"
  else
    echo "App Service already in '$APP_STATE' state"
  fi
  
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
SWA_HOST=$(az staticwebapp show -g "$RESOURCE_GROUP" -n "$SWA_NAME" --query defaultHostname -o tsv 2>/dev/null || true)

echo "✅ All resources are running!"
echo ""
echo "📍 Resource URLs:"
echo "   Backend API: https://$APP_SERVICE.azurewebsites.net"
if [ -n "$SWA_HOST" ]; then
  echo "   Frontend: https://$SWA_HOST"
else
  echo "   Frontend: (Static Web App '$SWA_NAME' not found)"
fi
echo ""
echo "Next steps:"
echo "1. Test your application (see docs/ops/azure-test-guide.md)"
echo "2. When done, run: ./scripts/azure-delete-all.sh"
