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
    // this.logger.log('🔥 Initial sync at startup...');
    await this.syncPickups();
  }

  @Cron('*/3 * * * *')
  async syncPickups() {
    const BASE_URL = process.env.BASE_URL;
    const API_KEY = process.env.API_KEY;

    const cronStart = new Date();
    // this.logger.log(`⏱ Cron started at ${cronStart.toISOString()}`);

    try {
      // --- Fetch collectors ---
      const collectors = await this.collectorsService.findAll();
      // this.logger.log(`👤 Found ${collectors.length} collectors`);
      // collectors.forEach(c =>
      //   this.logger.log(`Collector: ${c.username} | Communes: ${c.communes} | ExpoToken: ${c.expoPushToken}`)
      // );

      // --- Delete old pickups according to status ---
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const twoDaysAgoStr = twoDaysAgo.toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });

      // this.logger.log(`🗑 Deleting done pickups from yesterday`);
      await this.pickupRepo
        .createQueryBuilder()
        .delete()
        .where(
          "status = :done AND TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Algiers','YYYY-MM-DD') <= :yesterday",
          { done: 'done', yesterday: yesterdayStr }
        )
        .execute();

      // this.logger.log(`🗑 Deleting canceled pickups older than 2 days`);
      await this.pickupRepo
        .createQueryBuilder()
        .delete()
        .where(
          "status = :canceled AND TO_CHAR(date AT TIME ZONE 'UTC' AT TIME ZONE 'Africa/Algiers','YYYY-MM-DD') <= :twoDaysAgo",
          { canceled: 'canceled', twoDaysAgo: twoDaysAgoStr }
        )
        .execute();

      // --- Get backend token ---
      let generalToken: string;
      try {
        const tokenData = await this.authService.getGeneralBackendToken();
        generalToken = tokenData.access_token;
        // this.logger.log(`🔑 Retrieved general backend token`);
      } catch (err) {
        this.logger.error(`⚠️ Failed to get general token: ${err.message}`);
        return;
      }

      // --- Fetch pickups from backend ---
      // this.logger.log(`🌐 Fetching pickups from general backend...`);
      const res = await axios.get(`${BASE_URL}/rest/v1/pickups?select=*,partners(name)`, {
        headers: { apikey: API_KEY, Authorization: `Bearer ${generalToken}` },
        httpsAgent: new https.Agent({ family: 4 }),
        timeout: 15000,
        validateStatus: () => true,
      });
      res.data.forEach((pickup) => {
  console.log("Pickup ID:", pickup.id, "Partners:", pickup);
});

      if (res.status !== 200) {
        this.logger.error(`❌ Failed to fetch pickups: ${res.status}`);
        return;
      }

      const pickups = res.data;
      // this.logger.log(`📦 Fetched ${pickups.length} pickups from backend`);

      // --- Filter today's pickups ---
      const toAlgiersDate = (date: string | Date) =>
        new Date(date).toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });

      const todaysPickups = pickups.filter(p => toAlgiersDate(p.date) === todayStr);
      // this.logger.log(`📅 Today's pickups: ${todaysPickups.map(p => p.id).join(', ')}`);

      // --- Fetch existing pickups in DB ---
      const existingPickups = await this.pickupRepo.find();
      const existingIds = new Set(existingPickups.map(p => p.id));
      // this.logger.log(`🗄 Existing pickups in DB: ${existingIds.size}`);

      // --- Prepare new pickups ---
      const newPickupsToSave: { pickup: any; collector: any }[] = [];
      for (const collector of collectors) {
        const collectorPickups = todaysPickups.filter(
          p =>
            Array.isArray(collector.communes) &&
            collector.communes.includes(p.province) &&
            !existingIds.has(String(p.id))
        );
        // this.logger.log(
        //   `Collector ${collector.username} matched new pickups: ${collectorPickups.map(p => p.id).join(', ')}`
        // );
        collectorPickups.forEach(pickup => newPickupsToSave.push({ pickup, collector }));
      }

      // this.logger.log(`📝 Total new pickups to save: ${newPickupsToSave.length}`);

      // --- Save new pickups and send notifications ---
// --- Save new pickups and send notifications ---
await Promise.all(
  newPickupsToSave.map(async ({ pickup, collector }) => {
    try {
      this.logger.log(
        `📦 Pickup ${pickup.id} -> partners: ${JSON.stringify(pickup.partners)}`
      );

      const partnerName =
        pickup.partners?.name ;

      if (!partnerName) {
        this.logger.warn(
          `⚠️ Pickup ${pickup.id} has NO partner name. Raw partners: ${JSON.stringify(
            pickup.partners
          )}`
        );
      } else {
        this.logger.log(
          `✅ Pickup ${pickup.id} partner name resolved: ${partnerName}`
        );
      }

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
  status: 'pending',
  assigned_to: String(collector.id),
partner_name: partnerName ?? null,
  raw: pickup,
});


      // this.logger.log(
      //   `💾 Saved pickup ${saved.id} with partner_name="${saved.partner_name}" for collector ${collector.username}`
      // );

      if (collector.expoPushToken) {
        await this.notificationsService.sendNotification(
          collector.expoPushToken,
          'تم تعيين طلب جديد',
          `${collector.username}، لديك طلب جديد في ${pickup.address}`,
          { type: 'NEW_PICKUP', pickupId: pickup.id },
        );

        // this.logger.log(
        //   `✅ Notification sent to ${collector.username} for pickup ${pickup.id}`
        // );
      } else {
        // this.logger.warn(
        //   `⚠️ No Expo token for collector ${collector.username}`
        // );
      }
    } catch (err) {
      // this.logger.error(
      //   `❌ Failed to save or notify pickup ${pickup.pickup?.id || 'unknown'}: ${
      //     err.message
      //   }`,
      // );
    }
    this.logger.log("hey");
  }),
);

      const total = await this.pickupRepo.count();
      // this.logger.log(`📊 Total pickups in DB after sync: ${total}`);

      const cronEnd = new Date();
      // this.logger.log(
      //   `⏱ Cron finished at ${cronEnd.toISOString()} (Duration: ${cronEnd.getTime() - cronStart.getTime()}ms)`
      // );
    } catch (err) {
      this.logger.error(`❌ Sync error: ${err.message}`, err.stack);
    }
  }
}
