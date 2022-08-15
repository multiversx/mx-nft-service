import { Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { Notification } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { TimeConstants } from 'src/utils/time-utils';
import { AuctionEntity } from 'src/db/auctions';
import { OrderEntity } from 'src/db/orders';

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

  private clearCache(auctions: AuctionEntity[], orders: OrderEntity[]) {
    let addreses = auctions.map((a) => a.ownerAddress);
    for (const orderGroup in orders) {
      addreses = [...addreses, orders[orderGroup][0].ownerAddress];
    }
    const uniqueAddresses = [...new Set(addreses)];
    this.redisCacheService.delMultiple(
      this.redisClient,
      uniqueAddresses.map((a) => this.getNotificationsCacheKey(a)),
    );
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
