#!/usr/bin/env node
const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

(async () => {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME || 'postgres',
    password: String(process.env.DB_PASSWORD ?? ''),
    database: process.env.DB_NAME || 'footdash',
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, token, platform, "userId" FROM notification_tokens ORDER BY id');
    if (!res || !res.rows) {
      console.log('No rows returned');
      process.exit(0);
    }
    console.table(res.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error querying notification_tokens:', err.message || err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
