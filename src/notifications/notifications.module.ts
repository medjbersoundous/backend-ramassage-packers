import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsService } from './notifications.service';
import { CollectorsModule } from '../collectors/collectors.module';

@Module({
  imports: [
    HttpModule,
    forwardRef(() => CollectorsModule), 
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
