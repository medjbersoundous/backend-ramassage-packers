import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class NotificationsService {
  private readonly expoApiUrl = 'https://exp.host/--/api/v2/push/send';

  /**
   * @param expoToken Expo push token
   * @param title Notification title
   * @param body Notification body
   * @param data Optional data payload
   */
  async sendNotification(
    expoToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<any> {
    if (!expoToken) {
      throw new HttpException(
        'Expo token is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response: AxiosResponse = await axios.post(this.expoApiUrl, {
        to: expoToken,
        sound: 'default',
        title,
        body,
        data,
      });

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error(
          'Error sending notification:',
          error.response?.data || error.message,
        );
      } else if (error instanceof Error) {
        console.error('Error sending notification:', error.message);
      } else {
        console.error('Unknown error sending notification:', error);
      }

      throw new HttpException(
        'Failed to send notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
