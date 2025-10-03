import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule'; 
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollectorsModule } from './collectors/collectors.module';
import { Collector } from './collectors/collector.entity';
import { AuthModule } from './auth/auth.module';
import { PickupsModule } from './pickups/pickups.module'; 
import { PickupEntity } from './pickups/pickups.entity';
import { AdminModule } from './admin/admin.module';
import { Admin } from './admin/admin.entity';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Collector, PickupEntity, Admin],
     synchronize: false,
      ssl: { rejectUnauthorized: false },
    }),
    ScheduleModule.forRoot(), 
    CollectorsModule,
    AuthModule,
    PickupsModule,
    AdminModule,
    NotificationsModule
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
