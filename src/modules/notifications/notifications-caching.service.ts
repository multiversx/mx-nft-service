import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { Notification } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class NotificationsCachingService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async getAllNotifications(address: string, getNotifications: () => any): Promise<[Notification[], number]> {
    return this.redisCacheService.getOrSet(this.getNotificationsCacheKey(address), () => getNotifications(), Constants.oneDay());
  }

  public clearMultipleCache(addresses: string[], marketplaceKey: string) {
    this.redisCacheService.deleteMany(addresses.map((a) => this.getNotificationsCacheKey(a)));

    this.redisCacheService.deleteMany(addresses.map((a) => this.getNotificationsCacheKey(`${a}_${marketplaceKey}`)));
  }

  public async invalidateCache(ownerAddress: string = '', marketplaceKey: string = ''): Promise<void> {
    await Promise.all([
      this.redisCacheService.delete(this.getNotificationsCacheKey(ownerAddress)),
      this.redisCacheService.delete(this.getNotificationsCacheKey(`${ownerAddress}_${marketplaceKey}`)),
    ]);
  }

  private getNotificationsCacheKey(key: string) {
    return generateCacheKeyFromParams('notifications', key);
  }
}
