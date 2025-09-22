import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectorsService } from './collectors.service';
import { CollectorsController } from './collectors.controller';
import { Collector } from './collector.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([Collector]),   NotificationsModule,],
  controllers: [CollectorsController],
  providers: [CollectorsService],
  exports: [CollectorsService],
})
export class CollectorsModule {}
