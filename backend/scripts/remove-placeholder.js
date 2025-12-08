#!/usr/bin/env node
/* Remove placeholder notification tokens used by the smoke script */
const { AppDataSource } = require('../data-source');
(async function main(){
  try{
    const ds = await AppDataSource.initialize();
    console.log('Connected, deleting placeholder tokens...');
    const res = await ds.query("DELETE FROM notification_tokens WHERE token LIKE '%for-testing-only%'");
    console.log('Delete result:', res);
    const rows = await ds.query('SELECT id, token, platform, "createdAt" FROM notification_tokens ORDER BY id');
    console.log('Remaining tokens:', JSON.stringify(rows, null, 2));
    await ds.destroy();
    process.exit(0);
  }catch(e){
    console.error('Error', e);
    process.exit(1);
  }
})();
