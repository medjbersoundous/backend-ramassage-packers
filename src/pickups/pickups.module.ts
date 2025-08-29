import { Module } from '@nestjs/common';
import { PickupsService } from './pickups.service';
import { PickupsController } from './pickups.controller';

@Module({
  providers: [PickupsService],
  controllers: [PickupsController],
})
export class PickupsModule {}
