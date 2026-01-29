// scripts/debug-schema.js
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'footdash',
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const tables = res.rows.map(r => r.table_name);
    console.log('Tables:', tables);

    if (tables.includes('users')) {
      const cols = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users'
      `);
      console.log('Users columns:', cols.rows.map(r => r.column_name));
    }

    if (tables.includes('refresh_tokens')) {
       console.log('refresh_tokens exists.');
    } else {
       console.log('refresh_tokens MISSING.');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

main();
