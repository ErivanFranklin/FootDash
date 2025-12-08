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
    const res = await client.query("SELECT id, token, length(token) as len, position(E'\\n' in token) as nlpos, encode(convert_to(token,'UTF8'),'escape') as escaped FROM notification_tokens ORDER BY id");
    console.log('diagnostic rows:');
    for (const r of res.rows) {
      console.log('---');
      console.log('id:', r.id);
      console.log('len:', r.len);
      console.log('nlpos:', r.nlpos);
      console.log('escaped:', r.escaped);
      console.log('raw token preview:', r.token.slice(0, 200));
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error diagnostics:', err.message || err);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
