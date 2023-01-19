import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { BlacklistedCollectionEntity } from 'src/db/blacklistedCollections';

@Injectable()
export class BlacklistedCollectionsCachingService {
  private redisClient: Redis.Redis;

  constructor(private readonly redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.assetsRedisClientName,
    );
  }

  async getOrSetBlacklistedCollections(
    getBlacklistedCollections: () => any,
  ): Promise<[BlacklistedCollectionEntity[], number]> {
    const cacheKey = this.getBlacklistedCollectionsCacheKey();
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getBlacklistedCollections,
      CacheInfo.BlacklistedCollections.ttl,
    );
  }

  async invalidateBlacklistedCollectionsCache(): Promise<void> {
    await this.redisCacheService.delByPattern(
      this.redisClient,
      CacheInfo.BlacklistedCollections.key,
    );
  }

  private getBlacklistedCollectionsCacheKey() {
    return generateCacheKeyFromParams(CacheInfo.BlacklistedCollections.key);
  }
}
