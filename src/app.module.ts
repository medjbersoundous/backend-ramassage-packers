import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; // ✅ import this
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
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),
    ScheduleModule.forRoot(), // ✅ enable cron jobs
    CollectorsModule,
    AuthModule,
    PickupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
