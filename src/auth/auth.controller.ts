import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body('phoneNumber') phoneNumber: number,
    @Body('password') password: string,
    @Body('expoPushToken') expoPushToken?: string,  
  ) {
    return this.authService.login(Number(phoneNumber), password, expoPushToken);
  }
}
