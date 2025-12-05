import 'reflect-metadata';
import AppDataSource from '../data-source';

async function run() {
  try {
    await AppDataSource.initialize();
    const rows: Array<{ id: number }> = await AppDataSource.query(
      `SELECT id FROM users WHERE password_hash IS NULL LIMIT 100`,
    );
    console.log(`Found ${rows.length} user(s) with NULL password_hash (showing up to 100):`);
    for (const r of rows) console.log(` - id=${r.id}`);
  } catch (err) {
    console.error('Error checking users for NULL password_hash:', err);
    process.exit(1);
  } finally {
    try {
      await AppDataSource.destroy();
    } catch (_) {}
  }
}

run();
