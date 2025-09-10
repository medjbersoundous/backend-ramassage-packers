import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollectorsModule } from './collectors/collectors.module';
import { Collector } from './collectors/collector.entity';
import { AuthModule } from './auth/auth.module';
import { PickupsModule } from './pickups/pickups.module'; 
import { PickupEntity } from './pickups/pickups.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Collector, PickupEntity],
      synchronize: true, // auto create tables in Supabase
      ssl: { rejectUnauthorized: false }, // ✅ required for Supabase
    }),
    CollectorsModule,
    AuthModule,
    PickupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
