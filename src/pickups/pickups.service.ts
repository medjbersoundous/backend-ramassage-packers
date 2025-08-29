import { Injectable, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import https from 'https';

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

      const today = new Date();
      const filteredPickups = res.data.filter(pickup => {
        const inCommune = Array.isArray(collector.communes) && collector.communes.includes(pickup.province);
        
        const pickupDate = new Date(pickup.date);
        const isToday =
          pickupDate.getFullYear() === today.getFullYear() &&
          pickupDate.getMonth() === today.getMonth() &&
          pickupDate.getDate() === today.getDate();

        return inCommune && isToday;
      });

      console.log('Filtered pickups for today:', filteredPickups.length);
      return filteredPickups;
    } catch (err) {
      console.error('Error fetching pickups:', err.message);
      console.error('Full error:', err);
      throw new UnauthorizedException('Error fetching pickups');
    }
  }
}
