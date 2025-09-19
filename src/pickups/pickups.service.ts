import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PickupsRepository } from './pickups.repository';
import { PickupEntity } from './pickups.entity';
import { PickupsGateway } from './pickups.gateway';

@Injectable()
export class PickupsService {
  constructor(
    private readonly pickupsRepository: PickupsRepository,
    private readonly pickupsGateway: PickupsGateway, 
  ) {}

  async getPickupsByCollector(collector) {
    return this.pickupsRepository.getPickupsByCollector(collector);
  }

  async updatePickup(id: string, updates: Partial<PickupEntity>, collector: any) {
    const pickup = await this.pickupsRepository.findOneById(id);
    if (!pickup) throw new NotFoundException('Pickup not found');

    if (String(pickup.assigned_to) !== String(collector.id)) {
      throw new ForbiddenException('You are not allowed to update this pickup');
    }

    Object.assign(pickup, updates);
    pickup.updated_at = new Date();

    const saved = await this.pickupsRepository.save(pickup);
    this.pickupsGateway.notifyChange();

    return saved;
  }
}
