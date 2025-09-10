import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';
import https from 'https';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PickupEntity } from './pickups.entity';
import { CollectorsService } from 'src/collectors/collectors.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class PickupsSyncService implements OnModuleInit {
  private readonly logger = new Logger(PickupsSyncService.name);

  constructor(
    @InjectRepository(PickupEntity)
    private pickupRepo: Repository<PickupEntity>,
    private readonly collectorsService: CollectorsService,
    private readonly authService: AuthService,
  ) {}

  async onModuleInit() {
    this.logger.log('🔥 Initial sync at startup...');
    await this.syncPickups();
  }

  @Cron('*/10 * * * *') // every 10 minutes
  async syncPickups() {
    const BASE_URL = process.env.BASE_URL;
    const API_KEY = process.env.API_KEY;

    try {
      const collectors = await this.collectorsService.findAll();
      this.logger.log(`👤 Found ${collectors.length} collectors`);

      for (const collector of collectors) {
        // 🔹 get general token dynamically
        let generalToken: string;
        try {
          const tokenData = await this.authService.getGeneralBackendToken();
          generalToken = tokenData.access_token;
        } catch (err) {
          this.logger.warn(`⚠️ Failed to get general token for collector ${collector.phoneNumber}: ${err.message}`);
          continue; // skip this collector
        }

        this.logger.log(`🔹 Fetching pickups for collector ${collector.phoneNumber}...`);

        const res = await axios.get(`${BASE_URL}/rest/v1/pickups`, {
          headers: {
            apikey: API_KEY,
            Authorization: `Bearer ${generalToken}`,
          },
          httpsAgent: new https.Agent({ family: 4 }),
          timeout: 15000,
          validateStatus: () => true,
        });

        if (res.status !== 200) {
          this.logger.error(`❌ Failed to fetch pickups for ${collector.phoneNumber}: ${res.status}`);
          continue;
        }

        const pickups = res.data;

        // Filter only today's pickups in collector's communes
        const toAlgiersDate = (date: string | Date) =>
          new Date(date).toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });

        const todayStr = toAlgiersDate(new Date());

        const todayPickups = pickups.filter(pickup => {
          const inCommune = Array.isArray(collector.communes) && collector.communes.includes(pickup.province);
          const pickupStr = toAlgiersDate(pickup.date);
          return inCommune && pickupStr === todayStr;
        });

        this.logger.log(`✅ Found ${todayPickups.length} pickups for collector ${collector.phoneNumber}`);

        // Save pickups to DB
        for (const pickup of todayPickups) {
          try {
            const saved = await this.pickupRepo.save({
              id: pickup.id,
              partner_id: pickup.partner_id,
              wilaya_id: pickup.wilaya_id,
              date: new Date(pickup.date),
              address: pickup.address,
              phone: pickup.phone,
              secondary_phone: pickup.secondary_phone,
              province: pickup.province,
              note: pickup.note,
              assigned_to: pickup.assigned_to,
              created_at: new Date(pickup.created_at),
              updated_at: new Date(pickup.updated_at),
              raw: pickup,
            });
            this.logger.log(`✅ Saved pickup ${saved.id}`);
          } catch (err) {
            this.logger.error(`❌ Failed to save pickup ${pickup.id}: ${err.message}`);
          }
        }
      }

      const total = await this.pickupRepo.count();
      this.logger.log(`📊 Total pickups in DB after sync: ${total}`);
    } catch (err) {
      this.logger.error(`Sync error: ${err.message}`, err.stack);
    }
  }
}
