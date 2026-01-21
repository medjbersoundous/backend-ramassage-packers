import { Controller, Post, Body, Get, Param, Patch, Delete } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { UpdateCollectorDto } from './dto/update-collector.dto/update-collector.dto';

@Controller('collectors')
export class CollectorsController {
  constructor(private readonly collectorsService: CollectorsService) {}

  @Post()
  async create(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('phoneNumber') phoneNumber: number,
    @Body('communes') communes: string[],
    @Body('expoPushTokens') expoPushTokens?: string[],
  ) {
    return this.collectorsService.create(
      username,
      password,
      phoneNumber,
      communes,
      expoPushTokens,
    );
  }

  @Get()
  findAll() {
    return this.collectorsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.collectorsService.findOne(id);
  }
  @Patch(':id')
  update(
    @Param('id') id: number,
    @Body() updateData: UpdateCollectorDto,
  ) {
    return this.collectorsService.update(id, updateData);
  }
  @Patch(':id/expo-token')
  updateExpoToken(
    @Param('id') id: string,
    @Body('expoToken') expoToken: string,
  ) {
    return this.collectorsService.updateExpoPushToken(+id, expoToken);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.collectorsService.remove(id);
  }

  @Get('by-phone/:phone')
  getByPhone(@Param('phone') phone: number) {
    return this.collectorsService.findByPhoneNumber(phone);
  }

  @Post('notify')
  notifyCollector(
    @Body('collectorId') collectorId: number,
    @Body('title') title: string,
    @Body('body') body: string,
  ) {
    return this.collectorsService.sendPushNotification(
      collectorId,
      title,
      body,
    );
  }
}
