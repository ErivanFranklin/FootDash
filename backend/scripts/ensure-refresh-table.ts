import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function verifyTable() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get('DataSource');
  
  const runner = dataSource.createQueryRunner();
  await runner.connect();
  const hasRefreshTokens = await runner.hasTable('refresh_tokens');
  console.log('Has refresh_tokens table:', hasRefreshTokens);
  
  if (!hasRefreshTokens) {
    console.log('Creating refresh_tokens table manually as fallback...');
    await runner.query(`
      CREATE TABLE IF NOT EXISTS "refresh_tokens" (
        "id" SERIAL PRIMARY KEY,
        "token" TEXT NOT NULL,
        "userId" INTEGER,
        "revoked" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    console.log('Table created.');
  }
  
  await runner.release();
  await app.close();
}

verifyTable();
