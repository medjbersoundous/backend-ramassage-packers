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
    console.log('⬇️ Upserting pickups count:', pickups.length);

    const mapped = pickups.map(p => ({
      id: p.id,
      partner_id: p.partner_id,
      wilaya_id: p.wilaya_id,
      date: new Date(p.date), // ensure Date type
      address: p.address,
      phone: p.phone,
      secondary_phone: p.secondary_phone,
      province: p.province,
      note: p.note,
      assigned_to: p.assigned_to,
      created_at: new Date(p.created_at),
      updated_at: new Date(p.updated_at),
      raw: p,
    }));

    const result = await this.repo.upsert(mapped, ['id']);
    console.log('✅ Upsert result:', result);
    return result;
  }

  async getTodayPickupsByCollector(collector) {
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));

    console.log('👤 Collector communes:', collector.communes);
    console.log('📅 Date range:', { start, end });

    // Log all pickups in DB
    const all = await this.repo.find();
    console.log('📦 All pickups in DB:', all);

    const pickups = await this.repo
      .createQueryBuilder('pickup')
      .where('pickup.province IN (:...communes)', { communes: collector.communes })
      .andWhere('pickup.date BETWEEN :start AND :end', { start, end })
      .getMany();

    console.log('✅ Pickups found for collector:', pickups);

    return pickups;
  }
}
