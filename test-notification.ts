import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { NotificationsService } from 'src/notifications/notifications.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const notificationsService = app.get(NotificationsService);

  try {
    const result = await notificationsService.sendNotification(
      'ExponentPushToken[DDDLSPDzWV0XQG2OdTjVj5]',
      'Test Notification',
      'Testing backend push'
    );
    console.log('Notification result:', result);
  } catch (err) {
    console.error('Notification failed:', err.message);
  } finally {
    await app.close();
  }
}

bootstrap();
