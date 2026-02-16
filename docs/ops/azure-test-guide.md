# Azure Build → Test → Delete Workflow Guide

This guide walks you through the complete workflow: deploy resources, test your app, and delete everything to avoid costs.

---

## 📋 Prerequisites

1. **Azure CLI installed and authenticated**:
   ```bash
   az login
   az account show
   ```

2. **Resources already created**: Follow `docs/ops/azure-dev-deployment.md` if this is your first time

3. **Scripts are executable** (already done):
   ```bash
   chmod +x scripts/azure-*.sh
   ```

---

## 🚀 Complete Workflow

### Step 1: Deploy & Start Resources

Start all Azure resources (or create missing ones like ACR if deleted):

```bash
./scripts/azure-deploy-all.sh
```

**What it does**:
- Starts PostgreSQL and App Service if stopped
- Recreates Container Registry if deleted
- Rebuilds backend container image if missing
- Configures App Service to use the latest image

**Duration**: 2-7 minutes (depending on what needs rebuilding)

**Expected output**:
```
✅ All resources are running!

📍 Resource URLs:
   Backend API: https://app-footdash-dev-api-eus2.azurewebsites.net
   Frontend: https://swa-footdash-dev-eus2.azurestaticapps.net
```

---

### Step 2: Test Your Application

#### Backend API Tests

**1. Check health endpoint**:
```bash
curl https://app-footdash-dev-api-eus2.azurewebsites.net
```
Expected: `{"message":"FootDash API is running"}` or similar

**2. Check database connection**:
```bash
curl https://app-footdash-dev-api-eus2.azurewebsites.net/health
```
Expected: Database connected successfully

**3. Test authentication endpoint**:
```bash
# Register a test user
curl -X POST https://app-footdash-dev-api-eus2.azurewebsites.net/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123!"}'

# Login
curl -X POST https://app-footdash-dev-api-eus2.azurewebsites.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

**4. View application logs**:
```bash
az webapp log tail -g rg-footdash-dev-eus2 -n app-footdash-dev-api-eus2
```
Press `Ctrl+C` to exit

---

#### Frontend Tests

**1. Open in browser**:
```bash
open https://swa-footdash-dev-eus2.azurestaticapps.net
```
Or manually visit: https://swa-footdash-dev-eus2.azurestaticapps.net

**2. Test features**:
- ✅ Login/Registration forms load
- ✅ Can create an account
- ✅ Can log in with created account
- ✅ Dashboard displays after login
- ✅ API calls to backend work (check Network tab in browser DevTools)

---

#### Database Tests

**1. Connect to PostgreSQL** (optional):
```bash
# Get connection details
az postgres flexible-server show \
  -g rg-footdash-dev-eus2 \
  -n pg-footdash-dev-eus2 \
  --query "{host:fullyQualifiedDomainName,adminUser:administratorLogin}" -o table

# Connect via psql
psql "postgresql://Erivan@pg-footdash-dev-eus2:5432/footdash_dev?sslmode=require"
```

**2. Verify tables exist**:
```sql
\dt
-- Should show: users, matches, teams, etc.
```

---

### Step 3: Review Costs (Optional)

Check current spending:

```bash
# View cost analysis in Azure Portal
open "https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis"
```

Or check resource costs:
```bash
az consumption usage list \
  --start-date $(date -u -v-1d +"%Y-%m-%d") \
  --end-date $(date -u +"%Y-%m-%d") \
  --query "[?contains(instanceName,'footdash')]" -o table
```

---

### Step 4: Delete All Resources

**When you're done testing** and want to reduce costs to €0:

```bash
./scripts/azure-delete-all.sh
```

**What it does**:
- Asks for confirmation (type `DELETE`)
- Deletes the entire resource group `rg-footdash-dev-eus2`
- Removes ALL resources: ACR, App Service, PostgreSQL, Key Vault, SWA
- Reduces costs to **€0**

**Duration**: 5-10 minutes (runs in background)

**Cost after deletion**: €0/day

---

## 🔁 Repeating the Workflow

When you want to test again:

```bash
# Recreate all resources (follow full setup guide)
# See: docs/ops/azure-dev-deployment.md

# Or if resources exist but were stopped:
./scripts/azure-deploy-all.sh
```

---

## 📊 Cost Summary

| Stage | Cost | Duration |
|-------|------|----------|
| **Resources running** | €1.01/day | While testing |
| **Resources deleted** | €0.00/day | After cleanup |

**Example testing session**:
- Deploy: 9:00 AM
- Test: 9:10 AM - 11:00 AM (2 hours)
- Delete: 11:00 AM
- **Cost**: ~€0.08 (2 hours at €1.01/day)

---

## 🆘 Troubleshooting

### Backend not responding
```bash
# Check logs
az webapp log tail -g rg-footdash-dev-eus2 -n app-footdash-dev-api-eus2

# Restart if needed
az webapp restart -g rg-footdash-dev-eus2 -n app-footdash-dev-api-eus2
```

### Database connection errors
```bash
# Verify PostgreSQL is running
az postgres flexible-server show \
  -g rg-footdash-dev-eus2 \
  -n pg-footdash-dev-eus2 \
  --query state -o tsv
# Should return: Ready

# Check DATABASE_URL secret
az keyvault secret show \
  --vault-name kv-footdash-dev-eus2 \
  -n DATABASE-URL \
  --query value -o tsv
```

### Container image not found
```bash
# Rebuild image
az acr build \
  --registry acrfootdashdeveus2 \
  --image footdash-api:dev \
  --file backend/Dockerfile \
  ./backend
```

### Frontend not deployed
```bash
# Check SWA status
az staticwebapp show -g rg-footdash-dev-eus2 -n swa-footdash-dev-eus2

# Deploy frontend
cd frontend
npm install
npm run build
az staticwebapp deploy \
  -n swa-footdash-dev-eus2 \
  --app-location ./dist
```

---

## 📝 Quick Reference

| Command | Purpose |
|---------|---------|
| `./scripts/azure-deploy-all.sh` | Start all resources |
| `./scripts/azure-delete-all.sh` | Delete everything (€0 cost) |
| `./scripts/azure-stop-all.sh` | Stop App Service + DB (keeps ACR) |
| `./scripts/azure-start-all.sh` | Start App Service + DB |

---

## ✅ Testing Checklist

Use this checklist during testing:

- [ ] Backend API responds to health check
- [ ] Database connection works
- [ ] User registration succeeds
- [ ] User login succeeds and returns JWT token
- [ ] Frontend loads in browser
- [ ] Frontend can communicate with backend API
- [ ] Dashboard displays after login
- [ ] Match/team data loads correctly
- [ ] All console errors resolved
- [ ] Application logs show no errors

**Once all checked**: Run `./scripts/azure-delete-all.sh` to delete resources.

---

## 💡 Best Practices

1. **Test in short sessions**: Deploy → Test (1-2 hours) → Delete
2. **Use logs actively**: Monitor `az webapp log tail` during tests
3. **Document issues**: Note any errors before deleting resources
4. **Verify deletion**: Check Azure Portal to confirm resources are gone
5. **Cost alerts**: Set up Azure cost alerts for >€5/day spending

---

## 🔗 Related Documentation

- **Full Setup Guide**: `docs/ops/azure-dev-deployment.md`
- **Cost Optimization**: `docs/ops/azure-cost-optimization.md`
- **API Endpoints**: `docs/api/endpoints.md`
- **Architecture**: `docs/architecture/technical-architecture-overview.md`
