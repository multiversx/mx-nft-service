import { Injectable } from '@nestjs/common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { BlacklistedCollectionEntity } from 'src/db/blacklistedCollections';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';

@Injectable()
export class BlacklistedCollectionsCachingService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async getOrSetBlacklistedCollections(getBlacklistedCollections: () => any): Promise<[BlacklistedCollectionEntity[], number]> {
    const cacheKey = this.getBlacklistedCollectionsCacheKey();
    return await this.redisCacheService.getOrSet(cacheKey, getBlacklistedCollections, CacheInfo.BlacklistedCollections.ttl);
  }

  async invalidateBlacklistedCollectionsCache(): Promise<void> {
    await this.redisCacheService.delete(CacheInfo.BlacklistedCollections.key);
  }

  private getBlacklistedCollectionsCacheKey() {
    return generateCacheKeyFromParams(CacheInfo.BlacklistedCollections.key);
  }
}
