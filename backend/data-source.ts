import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

// Use namespace import to ensure compatibility when running under ts-node/commonjs
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

export const AppDataSource = new DataSource(
  databaseUrl
    ? {
        type: 'postgres',
        url: databaseUrl,
        synchronize: false,
        migrationsRun: false,
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        entities: [__dirname + '/src/**/*.entity.{ts,js}', __dirname + '/src/**/*.entity.ts'],
      }
    : {
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'footdash',
        synchronize: false,
        migrationsRun: false,
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        entities: [__dirname + '/src/**/*.entity.{ts,js}', __dirname + '/src/**/*.entity.ts'],
      },
);

export default AppDataSource;
