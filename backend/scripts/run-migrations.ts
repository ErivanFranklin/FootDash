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
    let applied: string[] = [];
    try {
      const rows: Array<{ name: string }> = await ds.query(`SELECT name FROM migrations ORDER BY id`);
      applied = rows.map(r => r.name);
    } catch (err) {
      const pgError = err as { code?: string; message?: string };
      if (pgError?.code === '42P01') {
        console.warn('Migrations table not found; treating as no migrations applied.');
        applied = [];
      } else {
        throw err;
      }
    }

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

    // End of show

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

export async function showFull(): Promise<void> {
  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized — checking migrations (dry-run, full)...');

    const migrationsDir = path.resolve(__dirname, '..', 'migrations');
    const fs = await import('fs');
    let configuredFromFiles: string[] = [];
    try {
      const all = fs.readdirSync(migrationsDir);
      const migrationFiles = all.filter((f: string) => f.endsWith('.ts') || f.endsWith('.js')).sort();
      configuredFromFiles = migrationFiles.map((f: string) => f.replace(/\.(ts|js)$/, ''));
    } catch (err) {
      console.warn('Could not read migrations directory:', err.message || err);
    }

    const rows: Array<{ name: string }> = await ds.query(`SELECT name FROM migrations ORDER BY id`);
    const applied = rows.map(r => r.name);

    console.log(`Configured migration files: ${configuredFromFiles.length}`);
    console.log(`Applied migrations: ${applied.length}`);

    if (configuredFromFiles.length === 0) {
      console.log('No local migration files found.');
      await ds.destroy();
      process.exit(0);
    }

    const pending: string[] = [];
    configuredFromFiles.forEach(base => {
      const candidates: string[] = [base];
      const m = base.match(/^(\d+)-(.+)$/);
      if (m) candidates.push(`${m[2]}${m[1]}`);
      const isApplied = candidates.some(c => applied.includes(c));
      if (!isApplied) pending.push(base);
    });

    if (pending.length === 0) {
      console.log('No pending migrations.');
      await ds.destroy();
      process.exit(0);
    }

    console.log('Pending migrations (detailed):');
    for (let i = 0; i < pending.length; i++) {
      const fileBase = pending[i];
      const filePathTs = path.resolve(migrationsDir, `${fileBase}.ts`);
      const filePathJs = path.resolve(migrationsDir, `${fileBase}.js`);
      console.log(`\n=== ${i + 1}. ${fileBase} ===`);
      // show candidate DB names
      const m = fileBase.match(/^(\d+)-(.+)$/);
      if (m) console.log(`Candidates for DB-recorded name: ${m[2]}${m[1]} and ${fileBase}`);
      else console.log(`Candidate for DB-recorded name: ${fileBase}`);

      // read and print migration file content if exists
      try {
        let content = '';
        if (fs.existsSync(filePathTs)) content = fs.readFileSync(filePathTs, 'utf8');
        else if (fs.existsSync(filePathJs)) content = fs.readFileSync(filePathJs, 'utf8');
        else content = '(migration source file not found)';

        // extract up() body for readability
        const upMatch = content.match(/up\s*\([^)]*\)\s*:\s*Promise<void>\s*\{([\s\S]*?)\n\s*\}/m) || content.match(/async up\s*\([^)]*\)\s*\{([\s\S]*?)\n\s*\}/m);
        if (upMatch && upMatch[1]) {
          console.log('\n--- up() body ---');
          console.log(upMatch[1].trim());
          console.log('--- end up() ---\n');
        } else {
          console.log('\n--- file content ---');
          console.log(content.substring(0, 4000));
          if (content.length > 4000) console.log('\n... (truncated)');
          console.log('--- end file content ---\n');
        }
      } catch (err) {
        console.warn('Could not read migration source:', err.message || err);
      }
    }

    await ds.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration dry-run full error', err);
    process.exit(1);
  }
}
