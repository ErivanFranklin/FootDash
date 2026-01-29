
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: String(process.env.DB_PASSWORD ?? ''),
  database: process.env.DB_NAME || 'footdash',
});

async function run() {
  await dataSource.initialize();
  const runner = dataSource.createQueryRunner();
  const table = await runner.getTable('users');
  console.log('Columns in users table:');
  table?.columns.forEach(c => console.log(`- ${c.name} (${c.type})`));
  await dataSource.destroy();
}

run().catch(console.error);
