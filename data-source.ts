import { DataSource } from 'typeorm';
import { Collector } from './src/collectors/collector.entity';
import { PickupEntity } from './src/pickups/pickups.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Collector, PickupEntity],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
});
