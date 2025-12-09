#!/usr/bin/env node
/*
  Cleanup script for notification tokens.
  - Removes obviously short/malformed tokens
  - Removes placeholder tokens used in testing
  - Prints a concise report
*/

import path from 'path';

async function getAppDataSource() {
  try {
    return require('../dist/src/data-source').AppDataSource;
  } catch (_) {
    return require('../src/data-source').AppDataSource;
  }
}

async function main() {
  let AppDataSource: any = null;
  try {
    // load .env from backend root if present
    require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
    AppDataSource = await getAppDataSource();
    await AppDataSource.initialize();

    // conservative cleanup criteria
    const shortThreshold = 50;
    const placeholderPattern = '%for-testing-only%';

    const summary: any = { removed: [], kept: 0 };

    // find short tokens
    const shortRows = await AppDataSource.query(`SELECT id, token, length(token) as len FROM notification_tokens WHERE length(token) < $1`, [shortThreshold]);
    for (const r of shortRows) {
      summary.removed.push({ id: r.id, reason: 'short', len: r.len, preview: (r.token || '').slice(0, 80) });
    }

    // find placeholder tokens
    const placeholderRows = await AppDataSource.query(`SELECT id, token FROM notification_tokens WHERE token LIKE $1`, [placeholderPattern]);
    for (const r of placeholderRows) {
      summary.removed.push({ id: r.id, reason: 'placeholder', preview: (r.token || '').slice(0, 80) });
    }

    const removeIds = summary.removed.map((r: any) => r.id);
    if (removeIds.length) {
      // delete using parameterized query
      await AppDataSource.query(`DELETE FROM notification_tokens WHERE id = ANY($1::int[])`, [removeIds]);
    }

    const totalAfter = await AppDataSource.query('SELECT count(*) FROM notification_tokens');
    summary.totalAfter = Number(totalAfter[0].count || 0);

    console.log('Notification tokens cleanup report:');
    console.log(JSON.stringify(summary, null, 2));

    if (AppDataSource && typeof AppDataSource.destroy === 'function') {
      await AppDataSource.destroy();
    }
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    try { if (AppDataSource && typeof AppDataSource.destroy === 'function') await AppDataSource.destroy(); } catch (_) {}
    process.exit(2);
  }
}

main();
