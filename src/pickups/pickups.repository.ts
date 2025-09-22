import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupEntity } from './pickups.entity';

@Injectable()
export class PickupsRepository {
  constructor(
    @InjectRepository(PickupEntity)
    private repo: Repository<PickupEntity>,
  ) {}

  async upsertPickups(pickups: any[]) {
    const mapped = pickups.map(p => ({
      id: p.id,
      partner_id: p.partner_id,
      wilaya_id: p.wilaya_id,
      date: new Date(p.date),
      address: p.address,
      phone: p.phone,
      secondary_phone: p.secondary_phone,
      province: p.province,
      note: p.note,
      assigned_to: p.assigned_to,
      status: p.status || 'pending',
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
      partner_name: p.partners?.name ?? null, 
      raw: p,
    }));

    return this.repo.upsert(mapped, ['id']);
  }
async getPickupsByCollector(collector: { id: any; }) {
  return this.repo
    .createQueryBuilder('pickup')
    .where('pickup.assigned_to = :collectorId', { collectorId: collector.id })
    .getMany();
}
  async findOneById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async save(pickup: PickupEntity) {
    return this.repo.save(pickup);
  }
}

