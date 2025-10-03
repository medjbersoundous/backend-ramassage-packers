import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collector } from './collector.entity';
import * as bcrypt from 'bcrypt';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CollectorsService {
  constructor(
    @InjectRepository(Collector)
    private collectorsRepo: Repository<Collector>,
    private readonly notificationsService: NotificationsService,  
  ) {}

async create(
  username: string,
  password: string,
  phoneNumber: number,
  communes: string[],
  expoPushTokens?: string[],
) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const lastCollector = await this.collectorsRepo
    .createQueryBuilder('collector')
    .select('collector.id')
    .orderBy('collector.id', 'DESC')
    .getOne();

  const nextId = lastCollector ? lastCollector.id + 1 : 1;

  const collector = this.collectorsRepo.create({
    id: nextId,
    username,
    password: hashedPassword,
    phoneNumber,
    communes,
    expoPushTokens: expoPushTokens ?? [],  
  });

  return this.collectorsRepo.save(collector);
}


  async findAll() {
    return this.collectorsRepo.find();
  }

  async findOne(id: number) {
    const collector = await this.collectorsRepo.findOne({ where: { id } });
    if (!collector) throw new NotFoundException(`Collector #${id} not found`);
    return collector;
  }

  async update(id: number, updateData: Partial<Collector>) {
    const collector = await this.findOne(id);

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    Object.assign(collector, updateData);
    return this.collectorsRepo.save(collector);
  }

  async remove(id: number) {
    const collector = await this.findOne(id);
    return this.collectorsRepo.remove(collector);
  }
async updateExpoPushToken(id: number, token: string) {
  const collector = await this.findOne(id);
  const tokens = collector.expoPushTokens || [];
  if (!tokens.includes(token)) {
    collector.expoPushTokens = [...tokens, token];
    await this.collectorsRepo.save(collector);
  }
  return collector;
}

async removeExpoPushToken(id: number, token: string) {
  const collector = await this.findOne(id);
  collector.expoPushTokens = (collector.expoPushTokens || []).filter(t => t !== token);
  return this.collectorsRepo.save(collector);
}

  async findByPhoneNumber(phoneNumber: number) {
    return this.collectorsRepo.findOne({ where: { phoneNumber } });
  }

  async sendPushNotification(collectorId: number, title: string, body: string) {
    const collector = await this.findOne(collectorId);
    if (!collector.expoPushTokens || collector.expoPushTokens.length === 0) {
      return { success: false, message: 'No push tokens for this collector' };
    }

    const results = await Promise.all(
      collector.expoPushTokens.map(token =>
        this.notificationsService.sendNotification(token, title, body),
      ),
    );

    return { success: true, results };
  }

async updateGeneralTokens(
  collectorId: number,
  accessToken: string | null,
  refreshToken: string | null,
  expiresAt?: number,
) {
  const collector = await this.findOne(collectorId);
  collector.generalAccessToken = accessToken ?? undefined;  
  collector.generalRefreshToken = refreshToken ?? undefined;
  collector.generalTokenExpiresAt = expiresAt ?? undefined;
  return this.collectorsRepo.save(collector);
}


  async getGeneralTokens(collectorId: number) {
    const collector = await this.findOne(collectorId);
    return {
      refreshToken: collector.generalRefreshToken,
      accessToken: collector.generalAccessToken,
      expiresAt: collector.generalTokenExpiresAt,
    };
  }

  async findOneById(id: number) {
    const collector = await this.collectorsRepo.findOne({ where: { id } });
    if (!collector) throw new NotFoundException(`Collector #${id} not found`);
    return collector;
  }
}
