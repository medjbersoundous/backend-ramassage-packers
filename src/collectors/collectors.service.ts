import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collector } from './collector.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CollectorsService {
  constructor(
    @InjectRepository(Collector)
    private collectorsRepo: Repository<Collector>,
  ) {}

  async create(
    username: string,
    password: string,
    phoneNumber: number,
    communes: string[],
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Get the collector with the highest current ID
    const lastCollector = await this.collectorsRepo
      .createQueryBuilder("collector")
      .select("collector.id")
      .orderBy("collector.id", "DESC")
      .getOne();
  
    // Determine next ID
    const nextId = lastCollector ? lastCollector.id + 1 : 1;
  
    const collector = this.collectorsRepo.create({
      id: nextId, // assign calculated ID
      username,
      password: hashedPassword,
      phoneNumber,
      communes,
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
}
