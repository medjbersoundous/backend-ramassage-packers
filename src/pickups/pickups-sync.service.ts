import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import https from 'https';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupEntity } from './pickups.entity';
import { CollectorsService } from '../collectors/collectors.service';
import { AuthService } from '../auth/auth.service';
import { NotificationsService } from '../notifications/notifications.service';

interface Pickup {
  id: string;
  partner_id: string;
  wilaya_id: string;
  date: string;
  address: string;
  phone: string;
  secondary_phone?: string;
  province: string;
  note?: string;
  partners?: { name?: string };
}

interface Collector {
  id: number;
  username: string;
  communes: string[];
  expoPushToken?: string;
}

@Injectable()
export class PickupsSyncService implements OnModuleInit {
  private readonly logger = new Logger(PickupsSyncService.name);

  constructor(
    @InjectRepository(PickupEntity)
    private pickupRepo: Repository<PickupEntity>,
    private readonly collectorsService: CollectorsService,
    private readonly authService: AuthService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.syncPickups();
  }

  @Cron('*/3 * * * *')
  async syncPickups() {
    const BASE_URL = process.env.BASE_URL;
    const API_KEY = process.env.API_KEY;

    const cronStart = new Date();
    this.logger.log(`⏱ Cron started at ${cronStart.toISOString()}`);

    try {
      const collectors: Collector[] = await this.collectorsService.findAll();
      this.logger.log(`👤 Found ${collectors.length} collectors`);

      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
      const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
      const twoDaysAgoStr = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });

      // Delete old pickups
      await this.pickupRepo
        .createQueryBuilder()
        .delete()
        .where(
          "status = :done AND TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Algiers','YYYY-MM-DD') <= :yesterday",
          { done: 'done', yesterday: yesterdayStr }
        )
        .execute();

      await this.pickupRepo
        .createQueryBuilder()
        .delete()
        .where(
          "status = :canceled AND TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Algiers','YYYY-MM-DD') <= :twoDaysAgo",
          { canceled: 'canceled', twoDaysAgo: twoDaysAgoStr }
        )
        .execute();

      const res = await axios.get(`${BASE_URL}/rest/v1/pickups?select=*,partners(name)`, {
        headers: { apikey: API_KEY },
        httpsAgent: new https.Agent({ family: 4 }),
        timeout: 15000,
        validateStatus: () => true,
      });

      if (res.status !== 200) {
        this.logger.error(`❌ Failed to fetch pickups: ${res.status}`);
        return;
      }

      const pickups: Pickup[] = res.data;
      const toAlgiersDate = (date: string | Date) =>
        new Date(date).toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });

      const todaysPickups = pickups.filter((p: Pickup) => toAlgiersDate(p.date) === todayStr);

      const existingPickups = await this.pickupRepo.find();
      const existingIds = new Set(existingPickups.map(p => p.id));
      const newPickupsToSave: { pickup: Pickup; collector: Collector; token: string }[] = [];

      for (const collector of collectors) {
        let generalToken: string;
        try {
    generalToken = await this.authService.getValidGeneralToken(Number(collector.id));
        } catch (err: unknown) {
          if (err instanceof Error) {
            this.logger.error(`⚠️ Failed to get valid token for collector ${collector.username}: ${err.message}`);
          } else {
            this.logger.error(`⚠️ Failed to get valid token for collector ${collector.username}: ${err}`);
          }
          continue;
        }

        const collectorPickups = todaysPickups.filter(
          (p: Pickup) =>
            Array.isArray(collector.communes) &&
            collector.communes.includes(p.province) &&
            !existingIds.has(String(p.id))
        );

        collectorPickups.forEach(pickup => newPickupsToSave.push({ pickup, collector, token: generalToken }));
      }

      await Promise.all(
        newPickupsToSave.map(async ({ pickup, collector }) => {
          try {
            const partnerName = pickup.partners?.name ?? null;

            await this.pickupRepo.save({
              id: String(pickup.id),
              partner_id: pickup.partner_id,
              wilaya_id: pickup.wilaya_id,
              date: new Date(pickup.date),
              address: pickup.address,
              phone: pickup.phone,
              secondary_phone: pickup.secondary_phone,
              province: pickup.province,
              note: pickup.note,
              status: 'pending',
              assigned_to: String(collector.id),
              partner_name: partnerName,
              raw: pickup,
            });

            if (collector.expoPushToken) {
              await this.notificationsService.sendNotification(
                collector.expoPushToken,
                'تم تعيين طلب جديد',
                `${collector.username}، لديك طلب جديد في ${pickup.address}`,
                { type: 'NEW_PICKUP', pickupId: pickup.id },
              );
            }
          } catch (err: unknown) {
            if (err instanceof Error) {
              this.logger.error(`❌ Failed to save or notify pickup ${pickup.id}: ${err.message}`);
            } else {
              this.logger.error(`❌ Failed to save or notify pickup ${pickup.id}: ${err}`);
            }
          }
        }),
      );

      const total = await this.pickupRepo.count();
      const cronEnd = new Date();
      this.logger.log(`📊 Total pickups in DB after sync: ${total}`);
      this.logger.log(`⏱ Cron finished at ${cronEnd.toISOString()} (Duration: ${cronEnd.getTime() - cronStart.getTime()}ms)`);

    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(`❌ Sync error: ${err.message}`, err.stack);
      } else {
        this.logger.error(`❌ Sync error: ${err}`);
      }
    }
  }
}
