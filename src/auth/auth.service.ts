import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CollectorsService } from '../collectors/collectors.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import https from 'https';

@Injectable()
export class AuthService {
  constructor(
    private collectorsService: CollectorsService,
    private jwtService: JwtService,
  ) {}

  // ✅ Validate directly by phoneNumber
  async validateCollector(phoneNumber: number, password: string) {
    console.log('Validating collector with phoneNumber:', phoneNumber);

    const collector = await this.collectorsService.findByPhoneNumber(phoneNumber);
    console.log('Found collector:', collector);

    if (!collector) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, collector.password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('Collector validated successfully');
    return collector;
  }

  async getGeneralBackendToken() {
    const BASE_URL = process.env.BASE_URL;
    const EMAIL = process.env.GENERAL_EMAIL;
    const PASSWORD = process.env.GENERAL_PASSWORD;
    const API_KEY = process.env.API_KEY;

    const url = `${BASE_URL}/auth/v1/token?grant_type=password`;
    const data = { email: EMAIL, password: PASSWORD };
    const headers = { 'Content-Type': 'application/json', apikey: API_KEY };

    try {
      const res = await axios.post(url, data, {
        headers,
        timeout: 15000,
        validateStatus: () => true,
        httpsAgent: new https.Agent({ family: 4 }),
      });

      if (res.status !== 200) {
        throw new UnauthorizedException(`Failed to get general backend token: ${res.status}`);
      }

      return res.data;
    } catch (err: any) {
      throw new UnauthorizedException('Failed to get general backend token');
    }
  }

  // ✅ Accept expoPushToken and persist it after successful login
  async login(phoneNumber: number, password: string, expoPushToken?: string) {
    const collector = await this.validateCollector(phoneNumber, password);

    // Save/update the Expo push token if provided
    if (expoPushToken) {
      await this.collectorsService.updateExpoPushToken(collector.id, expoPushToken);
    }

    const generalTokenData = await this.getGeneralBackendToken();

    const payload = {
      phoneNumber: collector.phoneNumber,
      sub: collector.id,
      general_access_token: generalTokenData.access_token || generalTokenData.token,
      communes: collector.communes,
    };

    const localJwt = this.jwtService.sign(payload);

    return {
      collector: {
        id: collector.id,
        phoneNumber: collector.phoneNumber,
        communes: collector.communes,
      },
      local_access_token: localJwt,
      general_access_token: generalTokenData.access_token || generalTokenData.token,
    };
  }
}
