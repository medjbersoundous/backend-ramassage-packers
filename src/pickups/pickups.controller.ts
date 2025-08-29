import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PickupsService } from './pickups.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('pickups')
export class PickupsController {
  constructor(private pickupsService: PickupsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getPickups(@Req() req) {
    const collector = req.user;
    return this.pickupsService.getPickupsByCollector(collector);
  }
}
