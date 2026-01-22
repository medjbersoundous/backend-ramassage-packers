// pickups.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PickupsService } from './pickups.service';
import { PickupsController } from './pickups.controller';
import { PickupsRepository } from './pickups.repository';
import { PickupEntity } from './pickups.entity';
import { PickupsSyncService } from './pickups-sync.service';
import { CollectorsModule } from '../collectors/collectors.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PickupsGateway } from './pickups.gateway';
@Module({
  imports: [TypeOrmModule.forFeature([PickupEntity]), CollectorsModule, AuthModule, NotificationsModule],
  providers: [PickupsService, PickupsRepository, PickupsSyncService, PickupsGateway],
  controllers: [PickupsController],
})
export class PickupsModule implements OnModuleInit {
  constructor(private readonly pickupsSyncService: PickupsSyncService) {}

  async onModuleInit() {
    console.log('PickupsModule initialized, starting sync service...');
    await (this.pickupsSyncService as any).onModuleInit();

  }
}
