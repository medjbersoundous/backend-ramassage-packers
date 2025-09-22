import { Controller, Post, Body, Get, Param, Put, Delete, Patch } from '@nestjs/common';
import { CollectorsService } from './collectors.service';
import { NotificationsService } from '../notifications/notifications.service';

@Controller('collectors')
export class CollectorsController {
  constructor(
    private readonly collectorsService: CollectorsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post()
  async create(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('phoneNumber') phoneNumber: number,
    @Body('communes') communes: string[],
    @Body('expoPushToken') expoPushToken?: string,
  ) {
    return this.collectorsService.create(
      username,
      password,
      phoneNumber,
      communes,
      expoPushToken,
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

  @Patch(':id/expo-token')
  async updateExpoToken(
    @Param('id') id: string,
    @Body('expoToken') expoToken: string,
  ) {
    return this.collectorsService.updateExpoPushToken(+id, expoToken);
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body()
    updateData: {
      username?: string;
      password?: string;
      communes?: string[];
      expoPushToken?: string;
    },
  ) {
    return this.collectorsService.update(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.collectorsService.remove(id);
  }

  @Get('by-phone/:phone')
  async getByPhone(@Param('phone') phone: number) {
    return this.collectorsService.findByPhoneNumber(phone);
  }

  @Post('notify')
  async notifyCollector(
    @Body('expoPushToken') expoPushToken: string,
    @Body('title') title: string,
    @Body('body') body: string,
  ) {
    return this.collectorsService.sendPushNotification(expoPushToken, title, body);
  }
}
