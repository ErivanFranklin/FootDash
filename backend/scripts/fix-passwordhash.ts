import 'reflect-metadata';
import AppDataSource from '../data-source';
import * as bcrypt from 'bcryptjs';

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('DataSource initialized — fixing passwordHash for existing users');

    const defaultPassword = process.env.FIX_DEFAULT_PASSWORD || 'changeme';
    const hash = await bcrypt.hash(defaultPassword, 10);

    // Detect column naming (snake_case vs camelCase) and update accordingly.
    const cols: Array<{ column_name: string }> = await AppDataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('password_hash', 'passwordHash')`,
    );

    if (cols.length === 0) {
      console.log('No password column found on users table. Nothing to update.');
      return;
    }

    let total = 0;
    for (const c of cols) {
      const col = c.column_name;
      const res = await AppDataSource.query(
        `UPDATE "users" SET "${col}" = $1 WHERE "${col}" IS NULL RETURNING id`,
        [hash],
      );
      total += res.length || 0;
    }

    console.log(`Updated ${total} user(s) password hash.`);

    // Fix NULL emails by assigning a unique placeholder per id (to satisfy NOT NULL constraint)
    const emailRes = await AppDataSource.query(
      `UPDATE "users" SET email = ('migrated-' || id || '@local.invalid') WHERE email IS NULL RETURNING id`,
    );
    console.log(`Updated ${emailRes.length} user(s) email.`);
  } catch (err) {
    console.error('Error fixing passwordHash:', err);
    process.exit(1);
  } finally {
    try {
      await AppDataSource.destroy();
    } catch (_) {}
  }
}

run();
