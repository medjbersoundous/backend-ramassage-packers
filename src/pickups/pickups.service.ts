import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PickupsRepository } from './pickups.repository';
import { PickupEntity } from './pickups.entity';
import { PickupsGateway } from './pickups.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { CollectorsService } from '../collectors/collectors.service';
import { AuthService } from '../auth/auth.service';
import axios from 'axios';

const statusMap: Record<string, number> = {
  pending: 0,
  done: 1,
  canceled: 2,
  deleted: 2,  
};

@Injectable()
export class PickupsService {
  private readonly logger = new Logger(PickupsService.name);

  constructor(
    private readonly pickupsRepository: PickupsRepository,
    private readonly pickupsGateway: PickupsGateway, 
    private readonly notificationsService: NotificationsService, 
    private readonly collectorsService: CollectorsService, 
    private readonly authService: AuthService, 
  ) {}

  async getPickupsByCollector(collector: any) {
    return this.pickupsRepository.getPickupsByCollector(collector);
  }

  async updatePickup(
    id: string,
    updates: Partial<PickupEntity>,
    currentUser: any,
  ) {
    const pickup = await this.pickupsRepository.findOneById(id);
    if (!pickup) throw new NotFoundException('Pickup not found');
    // this.logger.debug(`Current user: ${JSON.stringify(currentUser)}`);
    // this.logger.debug(`Current user role: ${currentUser.role}`);
    // this.logger.debug(`Role toLowerCase: ${currentUser.role?.toLowerCase()}`);
    // this.logger.debug(`Updates: ${JSON.stringify(updates)}`);
    // this.logger.debug(`Pickup assigned_to: ${pickup.assigned_to}`);

    const isAdmin = currentUser.role?.toLowerCase() === 'admin';
    this.logger.debug(`isAdmin: ${isAdmin}`);
    if (updates.assigned_to && updates.assigned_to !== pickup.assigned_to) {
      this.logger.debug('Attempting to reassign pickup');
      if (!isAdmin) {
        this.logger.debug('FORBIDDEN: Not admin, cannot reassign');
        throw new ForbiddenException('Only admin can reassign pickups');
      }
      this.logger.debug('Admin verified, allowing reassignment');
    } else if (!isAdmin) {
      this.logger.debug('Not reassigning and not admin, checking collector match');
      const assignedId = pickup.assigned_to ? String(pickup.assigned_to) : null;
      const currentId = currentUser.id ? String(currentUser.id) : null;

      this.logger.debug(`Assigned ID: ${assignedId}, Current ID: ${currentId}`);

      if (!assignedId) {
        this.logger.debug('FORBIDDEN: No assigned collector');
        throw new ForbiddenException('You are not allowed to update this pickup');
      }

      if (assignedId !== currentId) {
        this.logger.debug('FORBIDDEN: Current user is not the assigned collector');
        throw new ForbiddenException('You are not allowed to update this pickup');
      }
      this.logger.debug('Collector match verified');
    } else {
      this.logger.debug('Admin user, allowing all updates');
    }

    const previousStatus = pickup.status;

    Object.assign(pickup, updates);
    pickup.updated_at = new Date();

    const saved = await this.pickupsRepository.save(pickup);
    
    if (updates.status && updates.status !== previousStatus) {
      await this.updateExternalPickupStatus(saved, updates.status);
    }

    this.pickupsGateway.notifyChange();

    return saved;
  }

  private async updateExternalPickupStatus(pickup: PickupEntity, newStatus: string) {
    const EXTERNAL_API_URL = process.env.BASE_URL;
    const externalStatus = statusMap[newStatus];

    if (!pickup.assigned_to) {
      this.logger.warn(`Pickup ${pickup.id} has no assigned collector, skipping external update`);
      return;
    }

    try {
      const accessToken = await this.authService.getValidGeneralToken(Number(pickup.assigned_to));
      
      if (!accessToken) {
        throw new Error('Failed to retrieve valid access token');
      }

      const url = `${EXTERNAL_API_URL}/rest/v1/pickups?id=eq.${pickup.id}`;

      await axios.patch(
        url,
        { status: externalStatus },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: process.env.API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );

      this.logger.log(`Successfully updated external pickup ${pickup.id} to status ${externalStatus}`);
    } catch (err: any) {
      this.logger.error(`Failed to update external pickup ${pickup.id}:`, err.message);
      
      if (err.response) {
        this.logger.error(`Response status: ${err.response.status}`);
        this.logger.error(`Response data: ${JSON.stringify(err.response.data)}`);
      }
    }
  }

  async getAllPickups(): Promise<PickupEntity[]> {
    return this.pickupsRepository.findAll();
  }
}