#!/usr/bin/env node
const ds = require('../dist/src/data-source') || require('../src/data-source');
(async () => {
  try {
    // Try to import compiled data-source, fallback to TS source
    let dataSourceModule;
    try {
      dataSourceModule = require('../dist/src/data-source');
    } catch (_) {
      dataSourceModule = require('../src/data-source');
    }

    const { AppDataSource } = dataSourceModule;
    await AppDataSource.initialize();
    const res = await AppDataSource.query('SELECT id, token, platform, "userId" FROM notification_tokens ORDER BY id');
    console.log('notification_tokens rows:');
    console.table(res);
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Failed to list tokens:', err);
    process.exit(2);
  }
})();
