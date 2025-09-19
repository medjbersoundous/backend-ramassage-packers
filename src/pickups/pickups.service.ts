import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PickupsRepository } from './pickups.repository';
import { PickupEntity } from './pickups.entity';
import { PickupsGateway } from './pickups.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
import { CollectorsService } from 'src/collectors/collectors.service';
@Injectable()
export class PickupsService {
  constructor(
    private readonly pickupsRepository: PickupsRepository,
    private readonly pickupsGateway: PickupsGateway, 
    private readonly notificationsService: NotificationsService, 
    private readonly collectorsService: CollectorsService, 
  ) {}

  async getPickupsByCollector(collector) {
    return this.pickupsRepository.getPickupsByCollector(collector);
  }

async updatePickup(
  id: string,
  updates: Partial<PickupEntity>,
  currentCollector: any
) {
  const pickup = await this.pickupsRepository.findOneById(id);
  if (!pickup) throw new NotFoundException('Pickup not found');

  const oldAssignedTo = pickup.assigned_to;
  if (String(oldAssignedTo) !== String(currentCollector.id)) {
    throw new ForbiddenException('You are not allowed to update this pickup');
  }

  Object.assign(pickup, updates);
  pickup.updated_at = new Date();

  const saved = await this.pickupsRepository.save(pickup);
  if (updates.assigned_to && updates.assigned_to !== oldAssignedTo) {
    this.pickupsGateway.notifyChange();
  const newCollector = await this.collectorsService.findOneById(
  Number(updates.assigned_to)
);

    if (newCollector?.expoPushToken) {
      await this.notificationsService.sendNotification(
        newCollector.expoPushToken,
        'تم تعيين طلب جديد',
        `لديك طلب جديد في ${pickup.address}`,
        { type: 'NEW_PICKUP', pickupId: pickup.id },
      );
    }
  } else {
    this.pickupsGateway.notifyChange();
  }

  return saved;
}

}
