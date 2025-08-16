import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CollectorsService } from '../collectors/collectors.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import qs from 'qs'; 

@Injectable()
export class AuthService {
  constructor(
    private collectorsService: CollectorsService,
    private jwtService: JwtService,
  ) {}

  async validateCollector(phoneNumber: number, password: string) {
    console.log('Validating collector with phoneNumber:', phoneNumber);
  
    const collectors = await this.collectorsService.findAll();
    console.log('All collectors from DB:', collectors);
  
    const collector = collectors.find(c => c.phoneNumber === phoneNumber);
    console.log('Found collector:', collector);
  
    if (!collector) {
      console.log('Collector not found');
      throw new UnauthorizedException('Invalid credentials');
    }
  
    const isMatch = await bcrypt.compare(password, collector.password);
    console.log('Password match result:', isMatch);
  
    if (!isMatch) {
      console.log('Password does not match');
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
  
    console.log('--- General Backend Token Request ---');
    console.log('BASE_URL:', BASE_URL);
    console.log('EMAIL:', EMAIL);
    console.log('PASSWORD:', PASSWORD);
    console.log('API_KEY:', API_KEY);
  
    const url = `${BASE_URL}/auth/v1/token?grant_type=password`;
    const data = { email: EMAIL, password: PASSWORD };
    const headers = { 'Content-Type': 'application/json', apikey: API_KEY };
  
    console.log('Request URL:', url);
    console.log('Request Body:', data);
    console.log('Request Headers:', headers);
  
    try {
      const res = await axios.post(url, data, {
        headers,
        timeout: 15000, // 15 seconds
        validateStatus: status => true, // don't throw for HTTP errors
      });
  
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      console.log('Response data:', res.data);
  
      if (res.status !== 200) {
        console.error('General backend returned error status!');
        throw new UnauthorizedException(`Failed to get general backend token: ${res.status}`);
      }
  
      return res.data;
    } catch (err: any) {
      console.error('Axios request error:');
      console.error('Message:', err.message);
      console.error('Code:', err.code);
      console.error('Config:', err.config);
      console.error('Response data:', err.response?.data);
      console.error('Response status:', err.response?.status);
  
      throw new UnauthorizedException('Failed to get general backend token');
    }
  }
  
  
  async login(phoneNumber: number, password: string) {
    const collector = await this.validateCollector(phoneNumber, password);
    const generalTokenData = await this.getGeneralBackendToken();
    const payload = { phoneNumber: collector.phoneNumber, sub: collector.id };
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
