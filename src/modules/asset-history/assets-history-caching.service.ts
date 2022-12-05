import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import { AssetHistoryLog } from './models';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';

@Injectable()
export class AssetsHistoryCachingService {
  private redisClient: Redis.Redis;

  constructor(private readonly redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.assetsRedisClientName,
    );
  }

  async getOrSetHistoryLog(
    collection: string,
    nonce: string,
    limit: number,
    timestamp: string | number,
    getOrSetHistoryLog: () => any,
  ): Promise<AssetHistoryLog[]> {
    const cacheKey = this.getAssetHistoryCacheKey(
      collection,
      nonce,
      limit,
      timestamp,
    );
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getOrSetHistoryLog,
      CacheInfo.AssetHistory.ttl,
    );
  }

  async invalidateCache(identifier: string): Promise<void> {
    const { collection, nonce } =
      getCollectionAndNonceFromIdentifier(identifier);
    const cacheKeyPattern = generateCacheKeyFromParams(
      CacheInfo.AssetHistory.key,
      collection,
      nonce,
    );
    await this.redisCacheService.delByPattern(
      this.redisClient,
      cacheKeyPattern,
    );
  }

  getAssetHistoryCacheKey(
    collection: string,
    nonce: string,
    limit?: number,
    timestamp?: string | number,
  ) {
    return generateCacheKeyFromParams(
      CacheInfo.AssetHistory.key,
      collection,
      nonce,
      limit,
      timestamp,
    );
  }
}
