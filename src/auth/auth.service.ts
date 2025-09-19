import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CollectorsService } from '../collectors/collectors.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import https from 'https';

@Injectable()
export class AuthService {
  constructor(
    private readonly collectorsService: CollectorsService,
    private readonly jwtService: JwtService,
  ) {}
  async validateCollector(phoneNumber: number, password: string) {
    const collector = await this.collectorsService.findByPhoneNumber(phoneNumber);
    if (!collector) {
      throw new UnauthorizedException('Invalid credentials: collector not found');
    }

    const isMatch = await bcrypt.compare(password, collector.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials: wrong password');
    }

    return collector;
  }
  async getGeneralBackendToken() {
    const { BASE_URL, GENERAL_EMAIL, GENERAL_PASSWORD, API_KEY } = process.env;

    if (!BASE_URL || !GENERAL_EMAIL || !GENERAL_PASSWORD || !API_KEY) {
      throw new InternalServerErrorException('Missing required environment variables for authentication');
    }

    const url = `${BASE_URL}/auth/v1/token?grant_type=password`;
    const data = { email: GENERAL_EMAIL, password: GENERAL_PASSWORD };
    const headers = { 'Content-Type': 'application/json', apikey: API_KEY };

    try {
      const res = await axios.post(url, data, {
        headers,
        timeout: 15000,
        validateStatus: () => true,
        httpsAgent: new https.Agent({ family: 4 }),
      });

      if (res.status !== 200) {
        throw new UnauthorizedException(`Failed to get token: status ${res.status}`);
      }

      return res.data;
    } catch (err) {
      throw new UnauthorizedException('Failed to get general backend token');
    }
  }
  async refreshGeneralBackendToken(refreshToken: string) {
    const { BASE_URL, API_KEY } = process.env;

    if (!BASE_URL || !API_KEY) {
      throw new InternalServerErrorException('Missing required environment variables for token refresh');
    }

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
        return await this.getGeneralBackendToken();
      }

      return res.data;
    } catch {
      return await this.getGeneralBackendToken();
    }
  }
async login(phoneNumber: number, password: string, expoPushToken?: string) {
  const collector = await this.validateCollector(phoneNumber, password);
  if (expoPushToken) {
    await this.collectorsService.updateExpoPushToken(collector.id, expoPushToken);
  }
  const generalTokenData = await this.getGeneralBackendToken();
  await this.collectorsService.updateGeneralTokens(
    collector.id,
    generalTokenData.access_token,
    generalTokenData.refresh_token,
  generalTokenData.expires_in
  ? Date.now() + generalTokenData.expires_in * 1000
  : undefined

  );
  const payload = {
    sub: collector.id,
    phoneNumber: collector.phoneNumber,
    communes: collector.communes,
    general_access_token: generalTokenData.access_token,
    general_refresh_token: generalTokenData.refresh_token,
  };

  const localJwt = this.jwtService.sign(payload);

  return {
    collector: {
      id: collector.id,
      username: collector.username,
      phoneNumber: collector.phoneNumber,
      communes: collector.communes,
      expoPushToken: collector.expoPushToken,
      generalAccessToken: generalTokenData.access_token,
      generalRefreshToken: generalTokenData.refresh_token,
    },
    local_access_token: localJwt,
    general_access_token: generalTokenData.access_token,
    general_refresh_token: generalTokenData.refresh_token,
  };
}
async getValidGeneralToken(collectorId: number): Promise<string> {
  const { accessToken, refreshToken, expiresAt } = await this.collectorsService.getGeneralTokens(collectorId);

  if (!accessToken || !refreshToken || !expiresAt || Date.now() >= expiresAt) {
    const newTokens = refreshToken
      ? await this.refreshGeneralBackendToken(refreshToken)
      : await this.getGeneralBackendToken();

    await this.collectorsService.updateGeneralTokens(
      collectorId,
      newTokens.access_token,
      newTokens.refresh_token,
      newTokens.expires_in ? Date.now() + newTokens.expires_in * 1000 : undefined,
    );

    return newTokens.access_token;
  }
  return accessToken;
}


}
