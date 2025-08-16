import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectorsService } from './collectors.service';
import { CollectorsController } from './collectors.controller';
import { Collector } from './collector.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Collector])],
  controllers: [CollectorsController],
  providers: [CollectorsService],
  exports: [CollectorsService],
})
export class CollectorsModule {}
