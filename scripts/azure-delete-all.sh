#!/bin/bash
# Complete cleanup: Delete ALL Azure resources to reduce costs to €0

set -e

RESOURCE_GROUP="rg-footdash-dev-eus2"

echo "⚠️  WARNING: This will DELETE ALL Azure resources in $RESOURCE_GROUP"
echo "   This includes:"
echo "   - Container Registry (ACR)"
echo "   - App Service + App Service Plan"
echo "   - PostgreSQL Database"
echo "   - Key Vault"
echo "   - Static Web App"
echo "   - The entire Resource Group"
echo ""
echo "   💰 This will reduce your Azure costs to €0"
echo "   ⏱️  You can recreate everything later with azure-deploy-all.sh"
echo ""
read -p "Are you absolutely sure? Type 'DELETE' to confirm: " confirm

if [ "$confirm" != "DELETE" ]; then
  echo "❌ Cancelled"
  exit 1
fi

echo ""
echo "🗑️  Deleting all resources..."
echo ""

# Delete the entire resource group (cascades to all resources)
echo "Deleting resource group: $RESOURCE_GROUP"
az group delete -n "$RESOURCE_GROUP" --yes --no-wait

echo ""
echo "✅ Deletion initiated (running in background)"
echo "   This will take 5-10 minutes to complete"
echo "   Your costs will drop to €0 once completed"
echo ""
echo "To check deletion status:"
echo "   az group exists -n $RESOURCE_GROUP"
echo "   (should return 'false' when complete)"
echo ""
echo "To recreate resources:"
echo "   Follow the setup guide in docs/ops/azure-dev-deployment.md"
