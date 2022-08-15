import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Notification } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class NotificationsCachingService {
  private redisClient: Redis.Redis;
  constructor(private readonly redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  async getAllNotifications(
    address: string,
    getNotifications: () => any,
  ): Promise<[Notification[], number]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getNotificationsCacheKey(address),
      () => getNotifications(),
      TimeConstants.oneDay,
    );
  }

  async getNotificationsForMarketplace(
    address: string,
    marketplaceKey: string,
    getNotifications: () => any,
  ): Promise<[Notification[], number]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getNotificationsCacheKey(`${address}_${marketplaceKey}`),
      () => getNotifications(),
      TimeConstants.oneDay,
    );
  }

  private getNotificationsCacheKey(address: string) {
    return generateCacheKeyFromParams('notifications', address);
  }

  public clearMultipleCache(addresses: string[], marketplaceKey: string) {
    this.redisCacheService.delMultiple(
      this.redisClient,
      addresses.map((a) => this.getNotificationsCacheKey(a)),
    );

    this.redisCacheService.delMultiple(
      this.redisClient,
      addresses.map((a) =>
        this.getNotificationsCacheKey(`${a}_${marketplaceKey}`),
      ),
    );
  }

  public async invalidateCache(
    ownerAddress: string = '',
    marketplaceKey: string = '',
  ): Promise<void> {
    await Promise.all([
      this.redisCacheService.del(
        this.redisClient,
        this.getNotificationsCacheKey(ownerAddress),
      ),

      this.redisCacheService.del(
        this.redisClient,
        this.getNotificationsCacheKey(`${ownerAddress}_${marketplaceKey}`),
      ),
    ]);
  }
}
