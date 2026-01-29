import AppDataSource from '../data-source';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const email = process.env.SEED_EMAIL || 'local+test@example.com';
  const password = process.env.SEED_PASSWORD || 'Password123!';

  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized for seeding');

    // Ensure users table exists and insert a test user if not present
    const existing = await ds.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing && existing.length > 0) {
      console.log(`User ${email} already exists (id=${existing[0].id})`);
    } else {
      const hash = await bcrypt.hash(password, 10);
      const res = await ds.query(
        'INSERT INTO users (email, password_hash, created_at) VALUES ($1, $2, NOW()) RETURNING id',
        [email.toLowerCase(), hash]
      );
      console.log('Inserted seed user id=', res[0]?.id || '(unknown)');
    }

    const teamRows = await ds.query('SELECT id FROM teams LIMIT 1');
    if (!teamRows || teamRows.length === 0) {
      await ds.query(
        'INSERT INTO teams ("externalId", name, "shortCode") VALUES ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)',
        [
          140,
          'LA Galaxy',
          'LAG',
          33,
          'Manchester United',
          'MUN',
          49,
          'Chelsea',
          'CHE',
        ]
      );
      console.log('Inserted seed teams');
    } else {
      console.log('Teams already exist; skipping team seed');
    }

    await ds.destroy();
  } catch (err) {
    console.error('Seeding error', err);
    process.exit(1);
  }
}

seed();
