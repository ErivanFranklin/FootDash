import AppDataSource from '../data-source';
import * as bcrypt from 'bcryptjs';

async function run() {
  const email = (process.env.SUPER_ADMIN_EMAIL || 'erivanf10@gmail.com').toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!password) {
    throw new Error('SUPER_ADMIN_PASSWORD must be provided');
  }

  await AppDataSource.initialize();

  const hash = await bcrypt.hash(password, 10);

  const existing = await AppDataSource.query('SELECT id FROM users WHERE email = $1', [
    email,
  ]);

  if (existing.length === 0) {
    await AppDataSource.query(
      'INSERT INTO users (email, password_hash, role, created_at) VALUES ($1, $2, $3, NOW())',
      [email, hash, 'ADMIN'],
    );
    console.log('Created super admin user');
  } else {
    await AppDataSource.query(
      'UPDATE users SET password_hash = $1, role = $2 WHERE email = $3',
      [hash, 'ADMIN', email],
    );
    console.log('Updated super admin user');
  }

  const demoted = await AppDataSource.query(
    'UPDATE users SET role = $1 WHERE LOWER(email) <> $2 AND role = $3 RETURNING id, email',
    ['USER', email, 'ADMIN'],
  );

  console.log('Demoted admins:', demoted.length);

  const row = await AppDataSource.query(
    'SELECT id, email, role FROM users WHERE LOWER(email) = $1',
    [email],
  );

  console.log('Super admin record:', row[0]);

  await AppDataSource.destroy();
}

run().catch(async (error) => {
  console.error('Failed to set super admin', error);
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  } catch {}
  process.exit(1);
});
