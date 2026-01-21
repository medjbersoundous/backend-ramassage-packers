import { IsOptional, IsString, IsArray } from 'class-validator';

export class UpdateCollectorDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsArray()
  communes?: string[];

  @IsOptional()
  @IsArray()
  expoPushTokens?: string[];
}
