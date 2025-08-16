import { Module } from '@nestjs/common';
import { PickupsService } from './pickups.service';

@Module({
  providers: [PickupsService]
})
export class PickupsModule {}
