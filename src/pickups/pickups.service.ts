import { Injectable } from '@nestjs/common';
import { PickupsRepository } from './pickups.repository';

@Injectable()
export class PickupsService {
  constructor(
    private readonly pickupsRepository: PickupsRepository, // inject custom repo
  ) {}

  async getPickupsByCollector(collector) {
    return this.pickupsRepository.getTodayPickupsByCollector(collector);
  }
}
