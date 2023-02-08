import { Injectable, Logger } from '@nestjs/common';
import { MxApiService } from 'src/common';
import { mxConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AssetsQuery } from '../assets';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { Constants, RedisCacheService } from '@multiversx/sdk-nestjs';

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
      const cacheKey = this.getStatsCacheKey(
        identifier,
        marketplaceKey,
        paymentToken,
      );
      const getCollectionStats = () =>
        this.persistenceService.getCollectionStats(
          identifier,
          marketplaceKey,
          paymentToken,
        );
      return this.redisCacheService.getOrSet(
        cacheKey,
        getCollectionStats,
        5 * Constants.oneMinute(),
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting stats for a collection',
        {
          path: 'CollectionsStatsService.getStats',
          identifier,
          marketplaceKey,
          exception: err?.message,
        },
      );
      return new CollectionStatsEntity();
    }
  }

  private getStatsCacheKey(
    identifier: string,
    marketplaceKey: string = undefined,
    paymentToken: string = mxConfig.egld,
  ) {
    return generateCacheKeyFromParams(
      'collection_stats',
      identifier,
      marketplaceKey ?? '',
      paymentToken ?? '',
    );
  }

  async getItemsCount(
    identifier: string,
  ): Promise<{ key: string; value: string }> {
    try {
      const cacheKey = this.getCollectionNftsCacheKey(identifier);
      const getAccountStats = () =>
        this.apiService.getNftsCountForCollection(
          this.getQueryForCollection(identifier),
          identifier,
        );
      return this.redisCacheService.getOrSet(
        cacheKey,
        getAccountStats,
        Constants.oneDay(),
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting total nfts count for collection',
        {
          path: 'CollectionsStatsService.getItemsCount',
          identifier,
          exception: err?.message,
        },
      );
      return { key: identifier, value: '0' };
    }
  }

  private getCollectionNftsCacheKey(
    key: string,
    marketplaceKey: string = undefined,
  ) {
    return generateCacheKeyFromParams(
      'collectionAssetsCount',
      key,
      marketplaceKey,
    );
  }

  private getQueryForCollection(identifier: string): string {
    return new AssetsQuery().addCollection(identifier).build();
  }

  public async invalidateStats(identifier: string) {
    await this.redisCacheService.delete(this.getStatsCacheKey(identifier));
    await this.redisCacheService.delete(
      this.getCollectionNftsCacheKey(identifier),
    );
  }
}
