import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private readonly expoApiUrl = 'https://exp.host/--/api/v2/push/send';

  async sendNotification(
    expoToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    if (!expoToken) {
      throw new HttpException('Expo token is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const response = await axios.post(this.expoApiUrl, {
        to: expoToken,
        sound: 'default',
        title,
        body,
        data, 
      });

      return response.data;
    } catch (error) {
      console.error('Error sending notification:', error.response?.data || error.message);
      throw new HttpException(
        'Failed to send notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
