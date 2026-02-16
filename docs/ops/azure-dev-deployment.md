# FootDash Dev Deployment on Azure (Jenkins + Postgres)

## Overview
This guide documents a **dev-only** Azure deployment for FootDash using:
- Jenkins on an Azure VM
- App Service (Linux, B1) for backend (container)
- Azure Database for PostgreSQL Flexible Server (B1ms)
- Azure Static Web Apps (Free) for frontend
- Azure Container Registry (Basic)
- Azure Key Vault (Standard)

**Region (deployment):** `East US 2`.

---

## 1) Prerequisites
- Azure subscription
- Azure CLI installed
- Docker installed (for Jenkins build agent)
- GitHub repo access

### Find your subscription ID
```bash
az account show --query id -o tsv
az account list -o table
```

---

## 2) Naming + Variables
Use the prefix: `footdash-dev`

```bash
SUBSCRIPTION_ID="496ee70d-04f4-460f-a4fa-c8267059ee57"
RG="rg-footdash-dev-eus2"
LOC="eastus2"
ACR="acrfootdashdeveus2"
ASP="asp-footdash-dev-eus2"
APP="app-footdash-dev-api-eus2"
PG="pg-footdash-dev-eus2"
PG_ADMIN="Erivan"
DB_NAME="footdash_dev"
KV="kv-footdash-dev-eus2"
SWA="swa-footdash-dev-eus2"
VM="vm-footdash-dev-jenkins"
```

---

## 3) Azure Resources (CLI)
```bash
az login
az account set --subscription "$SUBSCRIPTION_ID"

az group create -n $RG -l $LOC

# ACR
az acr create -n $ACR -g $RG --sku Basic

# App Service Plan (Linux B1)
az appservice plan create -n $ASP -g $RG --is-linux --sku B1

# App Service (Docker)
az webapp create -n $APP -g $RG --plan $ASP \
  --deployment-container-image-name nginx:latest

# PostgreSQL Flexible Server (B1ms)
az postgres flexible-server create -g $RG -n $PG -l $LOC \
  --tier Burstable --sku-name Standard_B1ms --storage-size 32 \
  --admin-user $PG_ADMIN --admin-password "<STRONG_PASSWORD>" \
  --database-name $DB_NAME

# Key Vault
az keyvault create -n $KV -g $RG -l $LOC

# Existing Key Vault (created)
# Name: kv-footdash-dev-eus2
# URI: https://kv-footdash-dev-eus2.vault.azure.net/

# Static Web App (Free)
az staticwebapp create -n $SWA -g $RG -l $LOC
```

---

## 4) Jenkins VM (Azure B1s)
```bash
az vm create -g $RG -n $VM \
  --image Ubuntu2204 --size Standard_B1s \
  --admin-username azureuser --generate-ssh-keys

az vm open-port -g $RG -n $VM --port 8080
az vm open-port -g $RG -n $VM --port 22
```

### Install Jenkins
```bash
ssh azureuser@<VM_PUBLIC_IP>

sudo apt update
sudo apt install -y fontconfig openjdk-17-jre
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee \
  /usr/share/keyrings/jenkins-keyring.asc > /dev/null

echo deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/ | sudo tee \
  /etc/apt/sources.list.d/jenkins.list > /dev/null

sudo apt update && sudo apt install -y jenkins
sudo systemctl enable jenkins
sudo systemctl start jenkins

sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

---

## 5) Jenkins Service Principal
```bash
az ad sp create-for-rbac \
  --name "sp-footdash-dev" \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RG
```

Save into Jenkins Credentials:
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

Also set these as Jenkins env vars (global or pipeline):
- `ACR_NAME=acrfootdashdeveus2`
- `RESOURCE_GROUP=rg-footdash-dev-eus2`
- `APP_NAME=app-footdash-dev-api-eus2`
- `SWA_NAME=swa-footdash-dev-eus2`
- `SWA_DEPLOYMENT_TOKEN=<SWA_TOKEN>`

To retrieve the Static Web Apps deployment token:
```bash
az staticwebapp secrets list -n $SWA -g $RG --query properties.apiKey -o tsv
```

### Key Vault access for Jenkins (RBAC)
Your Key Vault has RBAC enabled. Grant the Jenkins service principal access to secrets:
```bash
az role assignment create \
  --assignee <AZURE_CLIENT_ID> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/496ee70d-04f4-460f-a4fa-c8267059ee57/resourceGroups/rg-footdash-dev-eus2/providers/Microsoft.KeyVault/vaults/kv-footdash-dev-eus2
```

Example: store secrets in Key Vault
```bash
az keyvault secret set --vault-name kv-footdash-dev-eus2 -n JWT-SECRET --value "<SECRET>"
az keyvault secret set --vault-name kv-footdash-dev-eus2 -n DATABASE-URL --value "postgres://Erivan:<PASS>@<PG_HOST>:5432/footdash_dev"
```

The repo `Jenkinsfile` pulls these Key Vault secrets (`JWT_SECRET`, `DATABASE_URL`) and applies them to App Service settings during deploy.

### Recommended: Key Vault references (best practice)
Instead of injecting raw values, App Service uses Key Vault references. Enable system-assigned identity and grant it access:
```bash
az webapp identity assign -g rg-footdash-dev-eus2 -n app-footdash-dev-api-eus2

APP_PRINCIPAL_ID=$(az webapp identity show -g rg-footdash-dev-eus2 -n app-footdash-dev-api-eus2 --query principalId -o tsv)
az role assignment create \
  --assignee $APP_PRINCIPAL_ID \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/496ee70d-04f4-460f-a4fa-c8267059ee57/resourceGroups/rg-footdash-dev-eus2/providers/Microsoft.KeyVault/vaults/kv-footdash-dev-eus2
```

Then set App Service settings using Key Vault references:
```bash
az webapp config appsettings set \
  --name app-footdash-dev-api-eus2 \
  --resource-group rg-footdash-dev-eus2 \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://kv-footdash-dev-eus2.vault.azure.net/secrets/DATABASE-URL/)" \
    JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://kv-footdash-dev-eus2.vault.azure.net/secrets/JWT-SECRET/)"
```

---

## 6) Jenkinsfile (dev)
```groovy
pipeline {
  agent any

  environment {
    AZURE_SUBSCRIPTION_ID = credentials('AZURE_SUBSCRIPTION_ID')
    AZURE_CLIENT_ID       = credentials('AZURE_CLIENT_ID')
    AZURE_CLIENT_SECRET   = credentials('AZURE_CLIENT_SECRET')
    AZURE_TENANT_ID       = credentials('AZURE_TENANT_ID')

    ACR_NAME = 'acrfootdashdeveus2'
    RESOURCE_GROUP = 'rg-footdash-dev-eus2'
    APP_NAME = 'app-footdash-dev-api-eus2'
    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Build Backend Image') {
      steps {
        sh '''
          az login --service-principal -u $AZURE_CLIENT_ID -p $AZURE_CLIENT_SECRET --tenant $AZURE_TENANT_ID
          az acr login -n $ACR_NAME
          docker build -t $ACR_NAME.azurecr.io/footdash-api:$IMAGE_TAG ./backend
          docker push $ACR_NAME.azurecr.io/footdash-api:$IMAGE_TAG
        '''
      }
    }

    stage('Deploy Backend') {
      steps {
        sh '''
          az webapp config container set \
            --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --docker-custom-image-name $ACR_NAME.azurecr.io/footdash-api:$IMAGE_TAG \
            --docker-registry-server-url https://$ACR_NAME.azurecr.io
        '''
      }
    }
  }
}
```

---

## 7) Backend Env Vars (App Service)
Set via Azure Portal or CLI:
- `DATABASE_URL=postgres://pgadmin:<PASS>@<PG_HOST>:5432/<DB>`
- `JWT_SECRET=<SECRET>`
- `NODE_ENV=development`
- `PORT=8080`

---

## 8) Frontend Deployment (Static Web Apps)
- The Jenkinsfile (below) deploys the frontend to SWA using the deployment token.
- Build output is `frontend/www` (from `frontend/angular.json`).
- If deploying manually, run `npm run build` in `frontend/` and upload via SWA CLI.

---

## 9) Cost Notes (Dev)
- **Jenkins VM** (B1s) incurs cost while running.
- **App Service Plan (B1)** incurs cost 24/7.
- **PostgreSQL (B1ms)** incurs cost 24/7.
- **SWA Free** is €0.
- **ACR Basic** + **Key Vault** add small monthly cost.

---

## Next Steps
- Confirm resource creation.
- Store secrets in Key Vault.
- Wire Jenkins pipeline.
- Add frontend deployment pipeline when ready.
