import AppDataSource from '../data-source';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const defaultPassword = process.env.SEED_PASSWORD || 'Password123!';
  const seedUsers = [
    { email: 'local+test@example.com', role: 'USER' },
    { email: 'test01@test.com', role: 'USER' },
    { email: 'demo.pro@footdash.com', role: 'USER' },
    { email: 'demo.user@footdash.com', role: 'USER' },
    { email: 'erivanf10@gmail.com', role: 'ADMIN' },
  ];

  const customSeedEmail = process.env.SEED_EMAIL;
  if (customSeedEmail) {
    seedUsers.push({
      email: customSeedEmail.toLowerCase(),
      role: 'USER',
    });
  }

  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized for seeding');

    // Ensure deterministic local users exist with known passwords.
    for (const user of seedUsers) {
      const email = user.email.toLowerCase();
      const existing = await ds.query('SELECT id FROM users WHERE email = $1', [email]);
      const hash = await bcrypt.hash(defaultPassword, 10);

      if (existing && existing.length > 0) {
        await ds.query(
          'UPDATE users SET password_hash = $1, role = $2, "two_factor_enabled" = false WHERE email = $3',
          [hash, user.role, email],
        );
        console.log(`Updated seed user ${email} (id=${existing[0].id})`);
      } else {
        const res = await ds.query(
          'INSERT INTO users (email, password_hash, role, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
          [email, hash, user.role],
        );
        console.log(`Inserted seed user ${email} id=${res[0]?.id || '(unknown)'}`);
      }
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
