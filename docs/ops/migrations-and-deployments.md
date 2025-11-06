# Migrations & Deployment runbook (Phase 1)

This runbook explains safe migration previews and apply steps, and a minimal deployment checklist for Phase 1.

## Migration preview (dry-run)
Use the project-provided scripts to preview migrations without applying them.

Local preview (disposable DB):

```bash
# Start a disposable Postgres container (example host port 32768)
docker run --name footdash-migrate -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=footdash -p 32768:5432 -d postgres:15

# Run preview (uses scripts/run-migrations)
cd backend-nest
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:32768/footdash npm run migrate:show
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:32768/footdash npm run migrate:show:full

# When done, remove container
docker rm -f footdash-migrate
```

CI preview
- A GitHub Actions job named `migration-dry-run` exists which runs `migrate:show` and `migrate:show:full` against a service Postgres and uploads logs.

## Applying migrations (staging / production)
1. Ensure you have a recent DB backup (snapshot) before applying migrations.
2. Run `migrate:show` against a staging DB that mirrors production to confirm no surprises.
3. Schedule a maintenance window if migrations are destructive or long-running.
4. Apply migrations:

```bash
cd backend-nest
DATABASE_URL=postgresql://postgres:postgres@prod-host:5432/footdash npm run migrate:run
```

5. Run smoke tests and health checks.

## Rollback strategy
- Prefer no-rollback DB migrations. Instead:
  - Use backward-compatible migrations where possible (e.g., add columns, then backfill, then remove old columns later).
  - If a destructive migration must be rolled back, restore DB from backup snapshot.

## Creating a migration (TypeORM example)

```bash
# Add migration file with TypeORM CLI (if configured)
npx typeorm migration:generate -n CreateSomething
```

Or create a manual migration in `backend-nest/migrations` following existing file patterns.

## Rollback Strategy & Procedures

### Database Migration Rollback

#### TypeORM Migration Revert
```bash
cd backend-nest
# Revert last migration
npm run migrate:revert

# Revert specific number of migrations
npm run migrate:revert -- -n 2

# Show migration status
npm run migrate:show
```

#### Manual Rollback Scripts
For complex migrations, create corresponding rollback scripts:

```typescript
// In migration file
export class CreateUsersTable1680000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE users`);
    }
}
```

#### Data Migration Rollbacks
For migrations that modify data:
```sql
-- Example: Revert data changes
UPDATE users SET status = 'old_status' WHERE status = 'new_status';
DELETE FROM audit_log WHERE action = 'migration_update' AND created_at > 'migration_timestamp';
```

### Application Rollback Procedures

#### Code Rollback via Git
```bash
# Identify problematic commit
git log --oneline -10

# Revert to previous working commit
git revert <problematic-commit-hash>

# Or reset to previous commit (CAUTION: destructive)
git reset --hard <previous-commit-hash>

# Force push if needed (only for hotfixes)
git push --force-with-lease origin main
```

#### Container Rollback
```bash
# Rollback to previous image tag
docker tag footdash-backend:v1.0.1 footdash-backend:v1.0.2
docker push footdash-backend:v1.0.1

# Update deployment
kubectl set image deployment/footdash-backend app=footdash-backend:v1.0.1
```

#### Blue-Green Deployment Rollback
```bash
# Switch traffic back to blue environment
kubectl patch service footdash-service -p '{"spec":{"selector":{"version":"blue"}}}'

# Verify blue environment health
curl http://footdash-blue/health

# Decommission green environment
kubectl delete deployment footdash-green
```

### Disaster Recovery Procedures

#### Complete Database Restore
1. **Stop Application**: Prevent new data corruption
   ```bash
   docker-compose stop backend-nest
   ```

2. **Identify Recovery Point**: Choose appropriate backup
   ```bash
   # List available backups
   ls -la /backups/*.backup
   ```

3. **Restore Database**: From latest backup
   ```bash
   # Create fresh database
   docker exec footdash-db dropdb -U postgres footdash
   docker exec footdash-db createdb -U postgres footdash

   # Restore from backup
   docker exec -i footdash-db pg_restore -U postgres -d footdash < /backups/latest.backup
   ```

4. **Verify Data Integrity**: Run consistency checks
   ```sql
   -- Check table counts
   SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del FROM pg_stat_user_tables;

   -- Check for orphaned records
   SELECT COUNT(*) FROM matches WHERE home_team_id NOT IN (SELECT id FROM teams);
   ```

5. **Restart Application**: Bring services back online
   ```bash
   docker-compose start backend-nest
   ```

#### Partial Data Recovery
For recovering specific tables or records:
```sql
-- Export from backup
pg_dump -t users -U postgres footdash_backup > users_backup.sql

-- Import to production
psql -U postgres footdash < users_backup.sql
```

### Rollback Decision Framework

#### When to Rollback
- **Immediate Rollback**: Security vulnerabilities, data corruption, critical functionality broken
- **Scheduled Rollback**: Non-critical issues during business hours
- **No Rollback**: If fix can be deployed faster than rollback

#### Rollback Risk Assessment
- **Low Risk**: Configuration changes, non-destructive migrations
- **Medium Risk**: Code changes affecting single feature
- **High Risk**: Database schema changes, authentication system changes

#### Rollback Time Windows
- **Immediate (< 5 min)**: Stop deployment, revert code
- **Fast (< 30 min)**: Database restore from backup
- **Extended (< 4 hours)**: Full disaster recovery procedure

### Post-Rollback Procedures

#### Data Consistency Checks
```sql
-- Verify no orphaned records
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'teams', COUNT(*) FROM teams
UNION ALL
SELECT 'matches', COUNT(*) FROM matches;

-- Check recent data integrity
SELECT COUNT(*) FROM users WHERE created_at > 'rollback_timestamp';
```

#### Application Verification
- Health checks pass
- Authentication works
- Core API endpoints respond
- No error spikes in logs

#### Communication
- Notify stakeholders of rollback
- Document incident and resolution
- Schedule post-mortem review

### Rollback Testing

#### Pre-deployment Testing
```bash
# Test migration rollback
npm run migrate:revert
npm run migrate:run  # Re-apply

# Test application rollback
git checkout previous-commit
npm test
npm run build
```

#### Automated Rollback Tests
Add to CI pipeline:
```yaml
- name: Test Migration Rollback
  run: |
    npm run migrate:run
    npm run migrate:revert
    npm run migrate:run
```

## Deployment checklist (minimal)
1. Merge PR for code changes via protected branch rule and confirm all status checks pass.
2. Ensure migration dry-run artifact shows no pending migrations (or approved plan).
3. Create DB backup / snapshot.
4. Deploy backend to staging and run `migrate:run` if required.
5. Run smoke and e2e tests against staging.
6. Promote to production and apply migrations if staging passes.

## Post-deploy verification
- Health endpoint returns 200
- Critical logs show no errors
- Key endpoints (auth, teams, matches) return expected responses

## Notes & links
- Migration scripts: `backend-nest/scripts/run-migrations.ts`
- Migrations directory: `backend-nest/migrations`
- CI job: `.github/workflows/backend-ci.yml` -> job `migration-dry-run`
