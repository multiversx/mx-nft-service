import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { cacheConfig } from 'src/config';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import {
  FeaturedCollectionEntity,
  FeaturedNftEntity,
} from 'src/db/featuredNfts';

@Injectable()
export class FeaturedCollectionsCachingService {
  private redisClient: Redis.Redis;

  constructor(private readonly redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.assetsRedisClientName,
    );
  }

  async getOrSetFeaturedCollections(
    getFeaturedCollections: () => any,
    limit?: number,
    offset?: number,
  ): Promise<[FeaturedCollectionEntity[], number]> {
    const cacheKey = this.getFeaturedCollectionsCacheKey();
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getFeaturedCollections,
      CacheInfo.FeaturedCollections.ttl,
    );
  }

  async getOrSetFeaturedNfts(
    getFeaturedNfts: () => any,
    limit?: number,
    offset?: number,
  ): Promise<[FeaturedNftEntity[], number]> {
    const cacheKey = this.getFeaturedNftsCacheKey(limit, offset);
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      cacheKey,
      getFeaturedNfts,
      CacheInfo.FeaturedNfts.ttl,
    );
  }

  async invalidateFeaturedCollectionsCache(): Promise<void> {
    await this.redisCacheService.delByPattern(
      this.redisClient,
      CacheInfo.FeaturedCollections.key,
    );
  }

  private getFeaturedNftsCacheKey(limit?: number, offset?: number) {
    return generateCacheKeyFromParams(
      CacheInfo.FeaturedNfts.key,
      limit,
      offset,
    );
  }

  private getFeaturedCollectionsCacheKey() {
    return generateCacheKeyFromParams(CacheInfo.FeaturedCollections.key);
  }
}
