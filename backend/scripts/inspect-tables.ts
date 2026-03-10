import AppDataSource from '../data-source';

async function run() {
  const ds = await AppDataSource.initialize();
  const rows = await ds.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name");
  console.log('Public tables:');
  rows.forEach((r:any) => console.log('- ' + r.table_name));
  await ds.destroy();
}

run().catch(e=>{console.error(e); process.exit(1);});
