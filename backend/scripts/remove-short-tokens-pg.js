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
    // Delete obviously truncated tokens (shorter than 50 chars)
    const res = await client.query("DELETE FROM notification_tokens WHERE length(token) < 50 RETURNING id, token");
    console.log('Removed short/truncated tokens count:', res.rowCount);
    if (res.rowCount) console.table(res.rows);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error deleting short tokens:', err.message || err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
