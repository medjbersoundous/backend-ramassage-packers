import { DataSource } from 'typeorm';
import { Collector } from './collectors/collector.entity';
import { PickupEntity } from './pickups/pickups.entity';
import { Admin } from './admin/admin.entity';  
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Collector, PickupEntity, Admin], 
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
});
