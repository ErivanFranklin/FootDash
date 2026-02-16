#!/bin/bash
# Recreate ACR and rebuild container image

set -e

RESOURCE_GROUP="rg-footdash-dev-eus2"
ACR_NAME="acrfootdashdeveus2"
APP_SERVICE="app-footdash-dev-api-eus2"

echo "🔄 Recreating Container Registry and rebuilding image..."

# Create ACR
echo "Creating ACR: $ACR_NAME"
az acr create \
  --resource-group "$RESOURCE_GROUP" \
  --name "$ACR_NAME" \
  --sku Basic \
  --location eastus2

# Build and push image
echo "Building backend container image..."
az acr build \
  --registry "$ACR_NAME" \
  --image footdash-api:dev \
  --file backend/Dockerfile \
  ./backend

# Update App Service to use new image
echo "Updating App Service container reference..."
az webapp config container set \
  --name "$APP_SERVICE" \
  --resource-group "$RESOURCE_GROUP" \
  --container-image-name "$ACR_NAME.azurecr.io/footdash-api:dev" \
  --container-registry-url "https://$ACR_NAME.azurecr.io"

echo "✅ ACR recreated and image deployed"
echo "🌐 Backend API: https://$APP_SERVICE.azurewebsites.net"
