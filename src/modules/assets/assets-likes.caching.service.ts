import { Inject, Injectable } from '@nestjs/common';
import '../../utils/extentions';
import { AssetLikeEntity } from 'src/db/assets';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { TimeConstants } from 'src/utils/time-utils';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Asset } from './models';
import { IsAssetLikedRedisHandler } from './loaders/asset-is-liked.redis-handler';

@Injectable()
export class AssetsLikesCachingService {
  private redisClient: Redis.Redis;
  private readonly ttl = 6 * TimeConstants.oneHour;

  constructor(
    private isAssetLikedRedisHandler: IsAssetLikedRedisHandler,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  getAssetLiked(
    address: string,
    getAssetLiked: () => any,
  ): Promise<[AssetLikeEntity[], number]> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getAssetLikedByCacheKey(address),
      getAssetLiked,
      this.ttl,
    );
  }

  async decrementLikesCount(identifier: string): Promise<number> {
    return await this.redisCacheService.decrement(
      this.redisClient,
      this.getAssetLikesCountCacheKey(identifier),
      this.ttl,
    );
  }

  async incremenLikesCount(identifier: string): Promise<number> {
    return await this.redisCacheService.increment(
      this.redisClient,
      this.getAssetLikesCountCacheKey(identifier),
      this.ttl,
    );
  }

  async loadLikesCount(identifier: string, loadLikesCount: () => any) {
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      this.getAssetLikesCountCacheKey(identifier),
      () => loadLikesCount,
      this.ttl,
    );
  }

  async getMostLikedAssets(getMostLikedAssets: () => any): Promise<Asset[]> {
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      this.getMostLikedAssetsCacheKey(),
      getMostLikedAssets,
      CacheInfo.MostLikedAssets.ttl,
    );
  }

  async invalidateCache(identifier: string, address: string): Promise<void> {
    await this.isAssetLikedRedisHandler.clearKey(`${identifier}_${address}`);
    await this.invalidateAssetLikeCache(identifier, address);
    await this.invalidateAssetLikedByCount(address);
  }

  private invalidateAssetLikedByCount(address: string): Promise<void> {
    const cacheKey = this.getAssetLikedByCacheKey(address);
    return this.redisCacheService.del(this.redisClient, cacheKey);
  }

  private invalidateAssetLikeCache(
    identifier: string,
    address: string,
  ): Promise<void> {
    const cacheKey = this.getAssetLikedCacheKey(identifier, address);
    return this.redisCacheService.del(this.redisClient, cacheKey);
  }

  private getAssetLikedCacheKey(identifier: string, address: string) {
    return generateCacheKeyFromParams('isAssetLiked', identifier, address);
  }

  private getAssetLikedByCacheKey(address: string) {
    return generateCacheKeyFromParams('assetLiked', address);
  }

  private getMostLikedAssetsCacheKey() {
    return generateCacheKeyFromParams(CacheInfo.MostLikedAssets.key);
  }

  private getAssetLikesCountCacheKey(identifier: string) {
    return generateCacheKeyFromParams('assetLikesCount', identifier);
  }
}
