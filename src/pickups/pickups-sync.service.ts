import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import https from 'https';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupEntity } from './pickups.entity';
import { CollectorsService } from 'src/collectors/collectors.service';
import { AuthService } from 'src/auth/auth.service';
import { NotificationsService } from 'src/notifications/notifications.service';

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
    this.logger.log('🔥 Initial sync at startup...');
    await this.syncPickups();
  }

@Cron('*/3 * * * *')
async syncPickups() {
  const BASE_URL = process.env.BASE_URL;
  const API_KEY = process.env.API_KEY;

  const cronStart = new Date();
  this.logger.log(`⏱ Cron started at ${cronStart.toISOString()}`);

  try {
    // --- Fetch collectors ---
    const collectors = await this.collectorsService.findAll();
    this.logger.log(`👤 Found ${collectors.length} collectors`);
    collectors.forEach(c =>
      this.logger.log(`Collector: ${c.username} | Communes: ${c.communes} | ExpoToken: ${c.expoPushToken}`)
    );

    // --- Delete old pickups ---
    const todayAlgiersStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
    this.logger.log(`🗑 Deleting pickups before: ${todayAlgiersStr}`);
    await this.pickupRepo
      .createQueryBuilder()
      .delete()
      .where(
        "TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Algiers', 'YYYY-MM-DD') < :today",
        { today: todayAlgiersStr }
      )
      .execute();

    // --- Get backend token ---
    let generalToken: string;
    try {
      const tokenData = await this.authService.getGeneralBackendToken();
      generalToken = tokenData.access_token;
      this.logger.log(`🔑 Retrieved general backend token`);
    } catch (err) {
      this.logger.error(`⚠️ Failed to get general token: ${err.message}`);
      return;
    }

    // --- Fetch pickups from backend ---
    this.logger.log(`🌐 Fetching pickups from general backend...`);
    const res = await axios.get(`${BASE_URL}/rest/v1/pickups`, {
      headers: { apikey: API_KEY, Authorization: `Bearer ${generalToken}` },
      httpsAgent: new https.Agent({ family: 4 }),
      timeout: 15000,
      validateStatus: () => true,
    });

    if (res.status !== 200) {
      this.logger.error(`❌ Failed to fetch pickups: ${res.status}`);
      return;
    }

    const pickups = res.data;
    this.logger.log(`📦 Fetched ${pickups.length} pickups from backend`);

    // --- Filter today's pickups ---
    const toAlgiersDate = (date: string | Date) =>
      new Date(date).toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
    const todayStr = toAlgiersDate(new Date());
    this.logger.log(`📅 Today's date in Algiers timezone: ${todayStr}`);

    const todaysPickups = pickups.filter(p => toAlgiersDate(p.date) === todayStr);
    this.logger.log(`✅ Pickups matching today: ${todaysPickups.map(p => p.id).join(', ')}`);

    // --- Fetch existing pickups in DB ---
    const existingPickups = await this.pickupRepo.find();
    const existingIds = new Set(existingPickups.map(p => p.id));
    this.logger.log(`🗄 Existing pickups in DB: ${existingIds.size}`);

    // --- Prepare new pickups ---
    const newPickupsToSave: { pickup: any; collector: any }[] = [];
    for (const collector of collectors) {
      const collectorPickups = todaysPickups.filter(
        p => Array.isArray(collector.communes) && collector.communes.includes(p.province) && !existingIds.has(String(p.id))
      );
      this.logger.log(`Collector ${collector.username} matched new pickups: ${collectorPickups.map(p => p.id).join(', ')}`);
      collectorPickups.forEach(pickup => newPickupsToSave.push({ pickup, collector }));
    }

    this.logger.log(`📝 Total new pickups to save: ${newPickupsToSave.length}`);

    // --- Save new pickups and send notifications ---
    await Promise.all(
      newPickupsToSave.map(async ({ pickup, collector }) => {
        try {
          const saved = await this.pickupRepo.save({
            id: String(pickup.id),
            partner_id: pickup.partner_id,
            wilaya_id: pickup.wilaya_id,
            date: new Date(pickup.date),
            address: pickup.address,
            phone: pickup.phone,
            secondary_phone: pickup.secondary_phone,
            province: pickup.province,
            note: pickup.note,
            assigned_to: String(collector.id),
            created_at: new Date(pickup.created_at),
            updated_at: new Date(pickup.updated_at),
            raw: pickup,
          });
          this.logger.log(`💾 Saved pickup ${saved.id} for collector ${collector.username}`);

          if (collector.expoPushToken) {
            this.logger.log(`📲 Sending notification to ${collector.username} token: ${collector.expoPushToken}`);
            await this.notificationsService.sendNotification(
              collector.expoPushToken,
              'New Pickup Assigned',
              `You have a new pickup at ${pickup.address}`,
              { type: 'NEW_PICKUP', pickupId: pickup.id },
            );
            this.logger.log(`✅ Notification sent to ${collector.username} for pickup ${pickup.id}`);
          } else {
            this.logger.warn(`⚠️ No Expo token for collector ${collector.username}`);
          }
        } catch (err) {
          this.logger.error(`❌ Failed to save or notify pickup ${pickup.id}: ${err.message}`);
        }
      })
    );

    const total = await this.pickupRepo.count();
    this.logger.log(`📊 Total pickups in DB after sync: ${total}`);

    const cronEnd = new Date();
    this.logger.log(`⏱ Cron finished at ${cronEnd.toISOString()} (Duration: ${cronEnd.getTime() - cronStart.getTime()}ms)`);

  } catch (err) {
    this.logger.error(`❌ Sync error: ${err.message}`, err.stack);
  }
}

}
