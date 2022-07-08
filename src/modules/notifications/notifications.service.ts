import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extentions';
import { Notification } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { TimeConstants } from 'src/utils/time-utils';
import {
  NotificationEntity,
  NotificationsServiceDb,
} from 'src/db/notifications';

@Injectable()
export class NotificationsService {
  private redisClient: Redis.Redis;
  constructor(
    private notificationServiceDb: NotificationsServiceDb,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.ordersRedisClientName,
    );
  }

  async getNotifications(address: string): Promise<[Notification[], number]> {
    const cacheKey = this.getNotificationsCacheKey(address);
    const getNotifications = () => this.getMappedNotifications(address);
    return this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getNotifications,
      TimeConstants.oneDay,
    );
  }

  async saveNotifications(notifications: NotificationEntity[]): Promise<void> {
    await this.notificationServiceDb.saveNotifications(notifications);
  }

  private async getMappedNotifications(address: string) {
    const [notificationsEntities, count] =
      await this.notificationServiceDb.getNotificationsForAddress(address);

    return [
      notificationsEntities.map((notification) =>
        Notification.fromEntity(notification),
      ),
      count,
    ];
  }

  private getNotificationsCacheKey(address: string) {
    return generateCacheKeyFromParams('notifications', address);
  }

  public async invalidateCache(ownerAddress: string = ''): Promise<void> {
    return this.redisCacheService.del(
      this.redisClient,
      this.getNotificationsCacheKey(ownerAddress),
    );
  }
}
