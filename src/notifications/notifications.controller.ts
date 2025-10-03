import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  async sendNotification(
    @Body('expoTokens') expoTokens: string | string[], 
    @Body('title') title: string,
    @Body('body') body: string,
    @Body('data') data?: Record<string, any>,
  ) {
    return this.notificationsService.sendNotification(expoTokens, title, body, data);
  }
}
