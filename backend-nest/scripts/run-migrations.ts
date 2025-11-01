import AppDataSource from '../data-source';
import { MigrationInterface } from 'typeorm';
import * as path from 'path';

export async function run(): Promise<void> {
  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized, running migrations...');
    const result = await ds.runMigrations();
    console.log('Migrations applied:', result.map(r => r.name));
    await ds.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

export async function show(): Promise<void> {
  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized — checking migrations (dry-run)...');

    // Try to build the configured migration list from the migrations directory (filename-based)
    // This is robust even when ts-node/register doesn't populate ds.migrations at runtime.
    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    let configuredFromFiles: string[] = [];
    try {
      const fs = await import('fs');
      const all = fs.readdirSync(migrationsDir);
      const migrationFiles = all.filter((f: string) => f.endsWith('.ts') || f.endsWith('.js')).sort();
      configuredFromFiles = migrationFiles.map((f: string) => f.replace(/\.(ts|js)$/, ''));
    } catch (err) {
      // if reading the dir fails, fallback to ds.migrations
      console.warn('Could not read migrations directory:', err.message || err);
      const configured: string[] = (ds.migrations || []).map((m: MigrationInterface & { name?: string }) => m.name).filter(Boolean) as string[];
      configuredFromFiles = configured.slice();
    }

    // applied migrations recorded in the DB
    const rows: Array<{ name: string }> = await ds.query(`SELECT name FROM migrations ORDER BY id`);
    const applied = rows.map(r => r.name);

    // Determine pending: for each file-base, derive candidate recorded names and check if applied
    const pending: string[] = [];
    configuredFromFiles.forEach(base => {
      const candidates: string[] = [base];
      const m = base.match(/^(\d+)-(.+)$/);
      if (m) {
        // filename like 1680000000000-CreateUsersTable -> candidate CreateUsersTable1680000000000
        candidates.push(`${m[2]}${m[1]}`);
      } else {
        const m2 = base.match(/^(.+?)(\d{10,})$/);
        if (m2) {
          candidates.push(`${m2[1]}${m2[2]}`);
          candidates.push(`${m2[2]}-${m2[1]}`);
        }
      }
      const isApplied = candidates.some(c => applied.includes(c));
      if (!isApplied) pending.push(base);
    });

    console.log(`Configured migration files: ${configuredFromFiles.length}`);
    console.log(`Applied migrations: ${applied.length}`);
    if (pending.length === 0) {
      console.log('No pending migrations.');
    } else {
      console.log('Pending migrations (will be applied in this order):');
      pending.forEach((p, i) => console.log(`${i + 1}. ${p}`));
    }

    await ds.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration dry-run error', err);
    process.exit(1);
  }
}

// When executed directly (node scripts/run-migrations.ts) run migrations.
// When required as a module (for migrate:show) we should NOT auto-run migrations — callers will invoke exported functions.
if (require.main === module) {
  // run if executed directly
  run();
}
