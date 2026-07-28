import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'postgres',
  entities: ['dist/src/entities/*.entity.js'], // ✅ dist/src/entities klasörü
  migrations: ['dist/src/migrations/*.js'], // ✅ dist/src/migrations klasörü
  synchronize: false,
  logging: true,
});