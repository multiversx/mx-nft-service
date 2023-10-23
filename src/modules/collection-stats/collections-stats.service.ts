import { Injectable, Logger } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { mxConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AssetsQuery } from '../assets';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class CollectionsStatsService {
  constructor(
    private persistenceService: PersistenceService,
    private apiService: MxApiService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {}

  async getStats(
    identifier: string,
    marketplaceKey: string = undefined,
    paymentToken: string = mxConfig.egld,
  ): Promise<CollectionStatsEntity> {
    try {
      const cacheKey = this.getStatsCacheKey(identifier, marketplaceKey, paymentToken);
      const getCollectionStats = () => this.persistenceService.getCollectionStats(identifier, marketplaceKey, paymentToken);
      return this.redisCacheService.getOrSet(cacheKey, getCollectionStats, CacheInfo.CollectionStats.ttl);
    } catch (err) {
      this.logger.error('An error occurred while getting stats for a collection', {
        path: 'CollectionsStatsService.getStats',
        identifier,
        marketplaceKey,
        exception: err?.message,
      });
      return new CollectionStatsEntity();
    }
  }

  async getItemsCount(identifier: string): Promise<{ key: string; value: string }> {
    try {
      const cacheKey = this.getCollectionNftsCacheKey(identifier);
      const getAccountStats = () => this.apiService.getNftsCountForCollection(this.getQueryForCollection(identifier), identifier);
      return this.redisCacheService.getOrSet(cacheKey, getAccountStats, CacheInfo.CollectionAssetsCount.ttl);
    } catch (err) {
      this.logger.error('An error occurred while getting total nfts count for collection', {
        path: 'CollectionsStatsService.getItemsCount',
        identifier,
        exception: err?.message,
      });
      return { key: identifier, value: '0' };
    }
  }

  private getStatsCacheKey(identifier: string, marketplaceKey: string = undefined, paymentToken: string = mxConfig.egld) {
    return generateCacheKeyFromParams(CacheInfo.CollectionStats.key, identifier, marketplaceKey ?? '', paymentToken ?? '');
  }

  private getCollectionNftsCacheKey(key: string, marketplaceKey: string = undefined) {
    if (marketplaceKey) {
      return generateCacheKeyFromParams(CacheInfo.CollectionAssetsCount.key, key, marketplaceKey);
    }
    return generateCacheKeyFromParams(CacheInfo.CollectionAssetsCount.key, key);
  }

  private getQueryForCollection(identifier: string): string {
    return new AssetsQuery().addCollection(identifier).build();
  }

  public async invalidateStats(identifier: string) {
    await this.redisCacheService.delete(this.getStatsCacheKey(identifier));
    await this.redisCacheService.delete(this.getCollectionNftsCacheKey(identifier));
  }
}
