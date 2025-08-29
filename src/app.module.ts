import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CollectorsModule } from './collectors/collectors.module';
import { Collector } from './collectors/collector.entity';
import { AuthModule } from './auth/auth.module';
import { PickupsModule } from './pickups/pickups.module'; 

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [Collector],
      synchronize: true,
    }),
    CollectorsModule,
    AuthModule,
    PickupsModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
