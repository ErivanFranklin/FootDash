# Azure Cost Optimization Guide

## Current Costs (February 2026)
- **Container Registry**: €0.98/day (~€30/month) — 97% of total cost
- **App Service**: €0.02/day (~€0.60/month)
- **PostgreSQL**: ~€0.00/day (minimal when stopped)
- **Key Vault**: <€0.01/day
- **Static Web App**: €0.00 (Free tier)

**Total**: €1.01/day = ~€30/month

---

## Cost Reduction Strategies

### Strategy 1: Stop Resources When Not Building (Saves ~€0.03/day)

**When to use**: End of each workday, weekends

```bash
# Stop everything (App Service + PostgreSQL)
./scripts/azure-stop-all.sh

# Start when needed
./scripts/azure-start-all.sh
```

**Savings**: Minimal (~€1/month) because ACR is the main cost

---

### Strategy 2: Delete ACR When Not Building (Saves €0.98/day = €30/month)

**When to use**: Breaks between development sprints (1+ weeks)

```bash
# Delete ACR (main cost driver)
./scripts/azure-delete-acr.sh

# When you resume development:
./scripts/azure-recreate-acr.sh
```

**Savings**: ~€30/month  
**Tradeoff**: Need to rebuild container images (~5 min) when resuming

---

## Daily Development Workflow

### End of Day (Stop Resources)
```bash
./scripts/azure-stop-all.sh
```
**Cost**: €0.98/day (ACR only)

### Start of Day (Resume Development)
```bash
./scripts/azure-start-all.sh
```
**Ready in**: ~2 minutes

---

## Long Break Workflow (1+ weeks without development)

### Before Break
```bash
# Stop everything first
./scripts/azure-stop-all.sh

# Then delete ACR to eliminate costs
./scripts/azure-delete-acr.sh
```
**Cost during break**: ~€0/day (only Key Vault pennies)

### Resume Development
```bash
# Recreate ACR and rebuild images
./scripts/azure-recreate-acr.sh

# Start other resources
./scripts/azure-start-all.sh
```
**Ready in**: ~5-7 minutes

---

## Cost Comparison

| Scenario | Daily Cost | Monthly Cost |
|----------|-----------|--------------|
| **All running** | €1.01 | ~€30 |
| **Stop App/DB nightly** | €0.98 | ~€29 |
| **Delete ACR between sprints** | ~€0.00 | ~€0 |

---

## Recommendations

1. **Daily**: Run `azure-stop-all.sh` at end of each workday
2. **Weekends**: Keep resources stopped (already stopped from Friday)
3. **Long breaks**: Delete ACR if not developing for 1+ weeks
4. **Active development**: Keep everything running during work hours only

---

## Alternative: Switch to Free Tier Resources

For minimal costs during development:
- **App Service**: Switch to F1 (Free) tier instead of B1
- **PostgreSQL**: Use Azure SQL Database Free tier (32GB limit)
- **ACR**: Delete and use Docker Hub or GitHub Container Registry (free)

---

## Quick Reference

| Command | Purpose | Time |
|---------|---------|------|
| `./scripts/azure-stop-all.sh` | Stop App Service + PostgreSQL | ~30s |
| `./scripts/azure-start-all.sh` | Start App Service + PostgreSQL | ~2min |
| `./scripts/azure-delete-acr.sh` | Delete ACR (save €30/month) | ~1min |
| `./scripts/azure-recreate-acr.sh` | Recreate ACR + rebuild images | ~5min |

---

## Notes

- **Static Web App (SWA)**: Already on Free tier (€0)
- **Key Vault**: Cannot be stopped, but costs <€0.01/day
- **ACR Basic SKU**: Costs €0.98/day regardless of usage
- **PostgreSQL**: Stops charging when stopped (only storage costs ~€0)
