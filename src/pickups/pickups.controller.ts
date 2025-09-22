import { Controller, Get, Put, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { PickupsService } from './pickups.service';
import { PickupEntity } from './pickups.entity';
import { Collector } from '../collectors/collector.entity'; 

@Controller('pickups')
export class PickupsController {
  constructor(private pickupsService: PickupsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getPickups(@Req() req: Request & { user: Collector }) {
    const collector = req.user;
    return this.pickupsService.getPickupsByCollector(collector);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async updatePickup(
    @Param('id') id: string,
    @Body() updates: Partial<PickupEntity>,
    @Req() req: Request & { user: Collector },
  ) {
    const collector = req.user;
    return this.pickupsService.updatePickup(id, updates, collector);
  }
}
