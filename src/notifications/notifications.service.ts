import { Injectable, HttpException, HttpStatus, Logger, Inject, forwardRef } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { CollectorsService } from '../collectors/collectors.service';
import axios, { AxiosResponse } from 'axios';

@Injectable()
export class NotificationsService {
  private readonly expoApiUrl = 'https://exp.host/--/api/v2/push/send';
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly httpService: HttpService,
    @Inject(forwardRef(() => CollectorsService)) 
    private readonly collectorsService: CollectorsService,
  ) {}

  async sendNotification(
    expoTokens: string | string[],
    title: string,
    body: string,
    data?: Record<string, any>,
    collectorId?: number,
  ): Promise<any> {
    const tokens = Array.isArray(expoTokens) ? expoTokens : [expoTokens];

    if (!tokens.length) {
      throw new HttpException('Expo token is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data,
      }));

      const response: AxiosResponse = await axios.post(this.expoApiUrl, messages);

      if (response.data?.data) {
        response.data.data.forEach((result: any, index: number) => {
          if (result.status === 'error') {
            this.logger.warn(
              `Expo push error for token ${tokens[index]}: ${result.message}`,
            );

            if (
              collectorId &&
              (result.details?.error === 'DeviceNotRegistered' ||
                result.details?.error === 'InvalidCredentials')
            ) {
              this.collectorsService
                .removeExpoPushToken(collectorId, tokens[index])
                .then(() =>
                  this.logger.log(
                    `Removed dead Expo token ${tokens[index]} for collector ${collectorId}`,
                  ),
                )
                .catch((err) =>
                  this.logger.error(
                    `Failed to remove dead token ${tokens[index]}: ${err.message}`,
                  ),
                );
            }
          }
        });
      }

      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          'Error sending notification:',
          error.response?.data || error.message,
        );
      } else if (error instanceof Error) {
        this.logger.error('Error sending notification:', error.message);
      } else {
        this.logger.error('Unknown error sending notification:', error);
      }

      throw new HttpException(
        'Failed to send notification',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
