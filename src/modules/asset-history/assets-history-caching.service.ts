import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@elrondnetwork/erdnest';
import { AssetHistoryLog } from './models';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { LocalRedisCacheService } from 'src/common';

@Injectable()
export class AssetsHistoryCachingService {
  constructor(
    private readonly redisCacheService: RedisCacheService,
    private readonly localRedisCacheService: LocalRedisCacheService,
  ) {}

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
    await this.localRedisCacheService.delByPattern(cacheKeyPattern);
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
