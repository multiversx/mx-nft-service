import { Injectable } from '@nestjs/common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { FeaturedCollectionEntity, FeaturedNftEntity } from 'src/db/featuredNfts';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class FeaturedCollectionsCachingService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async getOrSetFeaturedCollections(
    getFeaturedCollections: () => any,
    _limit?: number,
    _offset?: number,
  ): Promise<[FeaturedCollectionEntity[], number]> {
    const cacheKey = this.getFeaturedCollectionsCacheKey();
    return await this.redisCacheService.getOrSet(cacheKey, getFeaturedCollections, CacheInfo.FeaturedCollections.ttl);
  }

  async getOrSetFeaturedNfts(getFeaturedNfts: () => any, limit?: number, offset?: number): Promise<[FeaturedNftEntity[], number]> {
    const cacheKey = this.getFeaturedNftsCacheKey(limit, offset);
    return await this.redisCacheService.getOrSet(cacheKey, getFeaturedNfts, CacheInfo.FeaturedNfts.ttl);
  }

  async invalidateFeaturedCollectionsCache(): Promise<void> {
    await this.redisCacheService.delete(CacheInfo.FeaturedCollections.key);
  }

  private getFeaturedNftsCacheKey(limit?: number, offset?: number) {
    return generateCacheKeyFromParams(CacheInfo.FeaturedNfts.key, limit, offset);
  }

  private getFeaturedCollectionsCacheKey() {
    return generateCacheKeyFromParams(CacheInfo.FeaturedCollections.key);
  }
}
