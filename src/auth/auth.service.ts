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

  async validateCollector(phoneNumber: number, password: string) {
    const collector = await this.collectorsService.findByPhoneNumber(phoneNumber);
    if (!collector) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, collector.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return collector;
  }

  // 🔹 Get a new token with password
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
        throw new UnauthorizedException(`Failed to get token: ${res.status}`);
      }

      return res.data;
    } catch {
      throw new UnauthorizedException('Failed to get general backend token');
    }
  }

  // 🔹 Refresh the general backend token
  async refreshGeneralBackendToken(refreshToken: string) {
    const BASE_URL = process.env.BASE_URL;
    const API_KEY = process.env.API_KEY;

    const url = `${BASE_URL}/auth/v1/token?grant_type=refresh_token`;
    const data = { refresh_token: refreshToken };
    const headers = { 'Content-Type': 'application/json', apikey: API_KEY };

    try {
      const res = await axios.post(url, data, {
        headers,
        timeout: 15000,
        validateStatus: () => true,
        httpsAgent: new https.Agent({ family: 4 }),
      });

      if (res.status !== 200) {
        throw new UnauthorizedException(`Failed to refresh token: ${res.status}`);
      }

      return res.data;
    } catch {
      throw new UnauthorizedException('Failed to refresh general backend token');
    }
  }

  async login(phoneNumber: number, password: string, expoPushToken?: string) {
    const collector = await this.validateCollector(phoneNumber, password);

    if (expoPushToken) {
      await this.collectorsService.updateExpoPushToken(collector.id, expoPushToken);
    }

    // 🔹 get access + refresh token from external backend
    const generalTokenData = await this.getGeneralBackendToken();

    const payload = {
      phoneNumber: collector.phoneNumber,
      sub: collector.id,
      general_access_token: generalTokenData.access_token,
      general_refresh_token: generalTokenData.refresh_token, // 👈 keep this
      communes: collector.communes,
    };

    const localJwt = this.jwtService.sign(payload);

    return {
      collector: {
        id: collector.id,
        phoneNumber: collector.phoneNumber,
        communes: collector.communes,
        username: collector.username,
      },
      local_access_token: localJwt,
      general_access_token: generalTokenData.access_token,
      general_refresh_token: generalTokenData.refresh_token, // 👈 return it too
    };
  }
}
