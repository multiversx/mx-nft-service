import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { AssetHistoryLog } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class AssetsHistoryCachingService {
  constructor(private readonly redisCacheService: RedisCacheService) {}

  async getOrSetHistoryLog(
    collection: string,
    nonce: string,
    limit: number,
    timestamp: string | number,
    getOrSetHistoryLog: () => any,
  ): Promise<AssetHistoryLog[]> {
    const cacheKey = this.getAssetHistoryCacheKey(collection, nonce, limit, timestamp);
    return await this.redisCacheService.getOrSet(cacheKey, getOrSetHistoryLog, CacheInfo.AssetHistory.ttl);
  }

  getAssetHistoryCacheKey(collection: string, nonce: string, limit?: number, timestamp?: string | number) {
    return generateCacheKeyFromParams(CacheInfo.AssetHistory.key, collection, nonce, limit, timestamp);
  }
}
