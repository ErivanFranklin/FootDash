import AppDataSource from '../data-source';

async function run() {
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

run();
