import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { CachingService } from 'src/common/services/caching/caching.service';
import { CollectionType } from '../assets/models/Collection.type';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { TimeConstants } from 'src/utils/time-utils';
import { Marketplace } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class MarketplacesCachingService {
  private redisClient: Redis.Redis;
  constructor(private cacheService: CachingService) {
    this.redisClient = this.cacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  public async getAllMarketplaces(
    getMarketplaces: () => any,
  ): Promise<CollectionType<Marketplace>> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      CacheInfo.AllMarketplaces.key,
      () => getMarketplaces(),
      TimeConstants.oneHour,
    );
  }

  public async getMarketplaceByAddressAndCollection(
    getMarketplaceByAddress: () => any,
    key: string,
  ): Promise<Marketplace> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      generateCacheKeyFromParams('marketplace_address_collection', key),
      () => getMarketplaceByAddress(),
      TimeConstants.oneHour,
    );
  }

  public async getMarketplaceByCollection(
    getMarketplaceByCollection: () => any,
    key: string,
  ): Promise<Marketplace> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      generateCacheKeyFromParams('marketplace_collection', key),
      () => getMarketplaceByCollection(),
      TimeConstants.oneHour,
    );
  }

  public async getCollectionsByMarketplace(
    getCollectionsByMarketplace: () => any,
    key: string,
  ): Promise<string[]> {
    return await this.cacheService.getOrSetCache(
      this.redisClient,
      generateCacheKeyFromParams('collections_by_marketplace', key),
      () => getCollectionsByMarketplace(),
      30 * TimeConstants.oneMinute,
    );
  }

  public async invalidateCache() {
    await this.cacheService.deleteInCache(
      this.redisClient,
      CacheInfo.Campaigns.key,
    );
  }
}
