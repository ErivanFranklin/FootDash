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
    KV_NAME = 'kv-footdash-dev-eus2'
    SWA_NAME = 'swa-footdash-dev-eus2'
    SWA_DEPLOYMENT_TOKEN = credentials('SWA_DEPLOYMENT_TOKEN')

    IMAGE_TAG = "${env.BUILD_NUMBER}"
  }

  stages {
    stage('Checkout') {
      steps { checkout scm }
    }

    stage('Azure Login') {
      steps {
        sh '''
          az login --service-principal \
            -u $AZURE_CLIENT_ID \
            -p $AZURE_CLIENT_SECRET \
            --tenant $AZURE_TENANT_ID
          az account set --subscription $AZURE_SUBSCRIPTION_ID
        '''
      }
    }

    stage('Build Backend Image') {
      steps {
        sh '''
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
            --container-image-name $ACR_NAME.azurecr.io/footdash-api:$IMAGE_TAG \
            --container-registry-url https://$ACR_NAME.azurecr.io

          az webapp config appsettings set \
            --name $APP_NAME \
            --resource-group $RESOURCE_GROUP \
            --settings \
              DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://kv-footdash-dev-eus2.vault.azure.net/secrets/DATABASE-URL/)" \
              JWT_SECRET="@Microsoft.KeyVault(SecretUri=https://kv-footdash-dev-eus2.vault.azure.net/secrets/JWT-SECRET/)"
        '''
      }
    }

    stage('Build Frontend') {
      steps {
        sh '''
          cd frontend
          npm ci
          npm run build
        '''
      }
    }

    stage('Deploy Frontend') {
      steps {
        sh '''
          npx @azure/static-web-apps-cli deploy \
            --app-location frontend \
            --output-location www \
            --deployment-token $SWA_DEPLOYMENT_TOKEN \
            --env production
        '''
      }
    }
  }
}
