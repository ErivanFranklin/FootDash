import 'reflect-metadata';
import AppDataSource from '../data-source';

async function run() {
  try {
    await AppDataSource.initialize();
    const rows: Array<{ id: number; email: string | null; password_hash?: string | null }> = await AppDataSource.query(
      `SELECT id, email, (SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') as password_hash_exists FROM users WHERE email IS NULL LIMIT 100`,
    );
    console.log(`Found ${rows.length} user(s) with NULL email (showing up to 100):`);
    for (const r of rows) {
      console.log(` - id=${r.id} email=${r.email}`);
    }
  } catch (err) {
    console.error('Error checking users:', err);
    process.exit(1);
  } finally {
    try {
      await AppDataSource.destroy();
    } catch (_) {}
  }
}

run();
