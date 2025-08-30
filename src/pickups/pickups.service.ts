import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import https from 'https';
import { Pickup } from './pickups.entity';

@Injectable()
export class PickupsService {
  async getPickupsByCollector(collector) {
    const BASE_URL = process.env.BASE_URL;
    const API_KEY = process.env.API_KEY;
    const GENERAL_TOKEN = collector.general_access_token;

    console.log('--- getPickupsByCollector ---');
    console.log('Collector:', collector);
    console.log('GENERAL_TOKEN:', GENERAL_TOKEN);

    if (!GENERAL_TOKEN) {
      console.error('No general access token provided!');
      throw new UnauthorizedException('No general access token provided');
    }

    try {
      console.log('Making GET request to:', `${BASE_URL}/rest/v1/pickups`);
      console.log('Headers:', {
        apikey: API_KEY,
        Authorization: `Bearer ${GENERAL_TOKEN}`,
      });

      const res = await axios.get(`${BASE_URL}/rest/v1/pickups`, {
        headers: {
          apikey: API_KEY,
          Authorization: `Bearer ${GENERAL_TOKEN}`,
        },
        httpsAgent: new https.Agent({ family: 4 }),
        timeout: 15000,
        validateStatus: status => true,
      });

      console.log('Response status:', res.status);
      console.log('Total pickups:', res.data.length);

      if (res.status !== 200) {
        console.error('Failed to fetch pickups:', res.status, res.data);
        throw new UnauthorizedException('Failed to fetch pickups');
      }

      // Helper: convert to YYYY-MM-DD in Algeria TZ
      const toAlgiersDate = (date: string | Date) =>
        new Date(date).toLocaleDateString('en-CA', { timeZone: 'Africa/Algiers' });

      // Today string (Algeria timezone)
      const todayStr = toAlgiersDate(new Date());
      // console.log('📅 Today (Algiers):', todayStr);

      // Filter only today's pickups in collector's communes
      const todayPickups = res.data.filter(pickup => {
        const inCommune =
          Array.isArray(collector.communes) &&
          collector.communes.includes(pickup.province);

        if (!inCommune) return false;

        const pickupStr = toAlgiersDate(pickup.date);
        return pickupStr === todayStr;
      });

      console.log('✅ Today pickups count:', todayPickups.length);
      // console.log('Today IDs:', todayPickups.map(p => p.id));

      return todayPickups;
    } catch (err) {
      console.error('Error fetching pickups:', err.message);
      console.error('Full error:', err);
      throw new UnauthorizedException('Error fetching pickups');
    }
  }
}
