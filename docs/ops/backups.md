# Database Backup & Recovery (Phase 1)

This runbook covers backup strategies, retention policies, and recovery procedures for the FootDash PostgreSQL database.

## Backup Strategy Overview

### Backup Types

#### Full Backups
- Complete database snapshot
- Frequency: Weekly (Sundays 02:00 UTC)
- Retention: 4 weeks
- Size estimate: ~500MB (initial Phase 1)

#### Incremental Backups
- Changes since last full backup
- Frequency: Daily (except Sundays)
- Retention: 7 days
- Size estimate: ~50-100MB per backup

#### Continuous Archiving (WAL)
- Write-Ahead Log archiving
- Frequency: Continuous
- Retention: 7 days
- Enables Point-in-Time Recovery (PITR)

## Backup Implementation

### PostgreSQL Native Tools

#### Full Backup with pg_dump
```bash
# Full database backup
pg_dump -h localhost -U postgres -d footdash -F c -b -v > footdash_full_$(date +%Y%m%d_%H%M%S).backup

# Compressed backup
pg_dump -h localhost -U postgres -d footdash | gzip > footdash_full_$(date +%Y%m%d_%H%M%S).sql.gz
```

#### Continuous Archiving Setup
```bash
# postgresql.conf settings
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
archive_timeout = 60

# Create archive directory
mkdir -p /var/lib/postgresql/archive
chown postgres:postgres /var/lib/postgresql/archive
```

#### Point-in-Time Recovery
```bash
# Stop PostgreSQL
sudo systemctl stop postgresql

# Restore base backup
pg_restore -h localhost -U postgres -d footdash /path/to/base_backup.backup

# Restore WAL files
# Copy archived WAL files to pg_wal directory

# Start PostgreSQL
sudo systemctl start postgresql
```

### Docker-based Backup

#### Backup Script
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="footdash-db"

# Create backup directory
docker exec $CONTAINER_NAME mkdir -p $BACKUP_DIR

# Full backup
docker exec $CONTAINER_NAME pg_dump -U postgres -d footdash -F c -b > ${BACKUP_DIR}/footdash_full_${DATE}.backup

# Copy to host
docker cp $CONTAINER_NAME:${BACKUP_DIR}/footdash_full_${DATE}.backup ./backups/

echo "Backup completed: footdash_full_${DATE}.backup"
```

#### Automated Backup with Cron
```bash
# Add to crontab (crontab -e)
# Daily backup at 02:00
0 2 * * * /path/to/backup.sh

# Weekly full backup (Sundays)
0 2 * * 0 /path/to/backup-full.sh
```

### Cloud Storage Integration

#### AWS S3 Backup Upload
```bash
#!/bin/bash
# upload-to-s3.sh

BACKUP_FILE=$1
S3_BUCKET="footdash-backups"
S3_PATH="postgresql/$(date +%Y/%m)/"

aws s3 cp $BACKUP_FILE s3://$S3_BUCKET/$S3_PATH

# Set lifecycle policy for automatic deletion
aws s3api put-bucket-lifecycle-configuration \
  --bucket $S3_BUCKET \
  --lifecycle-configuration file://lifecycle-policy.json
```

#### Lifecycle Policy (lifecycle-policy.json)
```json
{
  "Rules": [
    {
      "ID": "Delete old backups",
      "Status": "Enabled",
      "Prefix": "postgresql/",
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
```

## Retention Policies

### Backup Retention Schedule

| Backup Type | Frequency | Retention | Storage Location |
|-------------|-----------|-----------|------------------|
| Full Backup | Weekly | 4 weeks | S3 + Local |
| Incremental | Daily | 7 days | S3 + Local |
| WAL Archive | Continuous | 7 days | S3 + Local |
| Transaction Logs | Continuous | 24 hours | Local only |

### Cleanup Scripts

#### Automatic Cleanup
```bash
#!/bin/bash
# cleanup-backups.sh

BACKUP_DIR="/backups"
RETENTION_DAYS=30

# Remove old backups
find $BACKUP_DIR -name "*.backup" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Cleanup completed: removed backups older than $RETENTION_DAYS days"
```

## Recovery Procedures

### Full Database Restore

#### From pg_dump Backup
```bash
# Create new database (if needed)
createdb -h localhost -U postgres footdash_restore

# Restore from backup
pg_restore -h localhost -U postgres -d footdash_restore /path/to/backup.backup

# Or from SQL dump
gunzip -c backup.sql.gz | psql -h localhost -U postgres -d footdash_restore
```

#### Docker-based Restore
```bash
# Stop application containers
docker-compose stop backend

# Restore database
docker exec -i footdash-db psql -U postgres -d footdash < backup.sql

# Restart application
docker-compose start backend
```

### Point-in-Time Recovery

#### Recovery to Specific Time
```bash
# recovery.conf (for PostgreSQL < 12)
restore_command = 'cp /archive/%f %p'
recovery_target_time = '2025-11-05 10:00:00 UTC'
recovery_target_action = 'promote'

# For PostgreSQL 12+
# Add to postgresql.conf
recovery_target_time = '2025-11-05 10:00:00 UTC'
recovery_target_action = 'promote'
```

### Partial Table Recovery

#### Restore Single Table
```bash
# Create temporary database
createdb temp_restore

# Restore full backup to temp database
pg_restore -d temp_restore backup.backup

# Export specific table
pg_dump -t users temp_restore > users_backup.sql

# Import to production
psql -d footdash < users_backup.sql

# Cleanup
dropdb temp_restore
```

## Testing & Validation

### Backup Integrity Checks

#### Verify Backup
```bash
# Test backup restoration
pg_restore --list backup.backup > backup_contents.txt

# Check backup size and contents
ls -lh backup.backup
grep -c "CREATE TABLE" backup_contents.txt
```

#### Automated Testing
```bash
#!/bin/bash
# test-backup.sh

BACKUP_FILE=$1
TEST_DB="backup_test_$(date +%s)"

# Create test database
createdb $TEST_DB

# Restore backup
pg_restore -d $TEST_DB $BACKUP_FILE

# Run basic queries
psql -d $TEST_DB -c "SELECT count(*) FROM users;" > /dev/null
psql -d $TEST_DB -c "SELECT count(*) FROM teams;" > /dev/null

# Cleanup
dropdb $TEST_DB

echo "Backup test passed: $BACKUP_FILE"
```

### Recovery Testing

#### Regular Recovery Drills
- Monthly: Test full database restore
- Quarterly: Test point-in-time recovery
- Annually: Test disaster recovery scenario

#### Recovery Time Objectives (RTO)
- Full restore: < 2 hours
- Table restore: < 30 minutes
- Point-in-time: < 4 hours

#### Recovery Point Objectives (RPO)
- Data loss tolerance: < 1 hour
- Critical data: < 5 minutes

## Security Considerations

### Backup Encryption
```bash
# Encrypt backup before storage
openssl enc -aes-256-cbc -salt -in backup.sql -out backup.sql.enc -k $ENCRYPTION_KEY

# Decrypt for restore
openssl enc -d -aes-256-cbc -in backup.sql.enc -out backup.sql -k $ENCRYPTION_KEY
```

### Access Control
- Backup files stored in secure S3 buckets
- Access limited to authorized personnel
- Encryption keys stored in secure vault
- Audit logging for backup access

### Secure Transfer
```bash
# Use HTTPS for S3 uploads
aws s3 cp --sse AES256 backup.sql s3://bucket/backup.sql

# SFTP for on-premises transfers
sftp user@backup-server <<< "put backup.sql"
```

## Monitoring & Alerting

### Backup Monitoring
- Backup completion status
- Backup file size validation
- Storage space availability
- Transfer success/failure

### Alert Conditions
- Backup failure
- Backup size anomalies (>50% size change)
- Storage space < 10% available
- Restore test failures

### Dashboard Metrics
- Last successful backup time
- Backup success rate
- Storage utilization
- Recovery test results

## Emergency Procedures

### Data Loss Incident Response
1. **Assess Impact**: Determine scope of data loss
2. **Stop Application**: Prevent further data corruption
3. **Identify Recovery Point**: Determine last good backup
4. **Restore from Backup**: Use appropriate restore method
5. **Validate Data**: Run integrity checks
6. **Resume Operations**: Bring application back online
7. **Post-Mortem**: Analyze root cause and prevention

### Contact Information
- Database Administrator: [contact]
- DevOps Lead: [contact]
- Security Team: [contact]

## Maintenance Tasks

### Daily
- Verify backup completion
- Check backup file integrity
- Monitor storage space

### Weekly
- Test backup restoration
- Review backup logs
- Update backup scripts

### Monthly
- Full disaster recovery test
- Review retention policies
- Update recovery procedures

---

**Note**: Implement automated backups before going to production. Test restore procedures regularly to ensure reliability.