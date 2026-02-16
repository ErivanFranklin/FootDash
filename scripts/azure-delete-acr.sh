#!/bin/bash
# Delete ACR to eliminate the largest cost (€0.98/day = ~€30/month)
# Only run this if you're willing to rebuild container images later

set -e

RESOURCE_GROUP="rg-footdash-dev-eus2"
ACR_NAME="acrfootdashdeveus2"

echo "⚠️  WARNING: This will delete your Container Registry (ACR)"
echo "   Cost savings: ~€30/month"
echo "   You'll need to recreate it and rebuild images when needed"
echo ""
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Cancelled"
  exit 1
fi

echo "Deleting ACR: $ACR_NAME"
az acr delete -g "$RESOURCE_GROUP" -n "$ACR_NAME" --yes

echo "✅ ACR deleted. Daily cost reduced by €0.98"
echo ""
echo "To recreate when needed:"
echo "  az acr create -g $RESOURCE_GROUP -n $ACR_NAME --sku Basic -l eastus2"
echo "  cd backend && az acr build -r $ACR_NAME -t footdash-api:dev ."
