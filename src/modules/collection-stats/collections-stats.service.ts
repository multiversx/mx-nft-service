import { Injectable, Logger } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AssetsQuery } from '../assets';
import { TimeConstants } from 'src/utils/time-utils';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';
import { PersistenceService } from 'src/common/persistence/persistence.service';

@Injectable()
export class CollectionsStatsService {
  private redisClient: Redis.Redis;
  constructor(
    private persistenceService: PersistenceService,
    private apiService: ElrondApiService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  async getStats(
    identifier: string,
    marketplaceKey: string = undefined,
    paymentToken: string = 'EGLD',
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
        this.redisClient,
        cacheKey,
        getCollectionStats,
        5 * TimeConstants.oneMinute,
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
    paymentToken: string = 'EGLD',
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
  ): Promise<{ key: string; value: number }> {
    try {
      const cacheKey = this.getCollectionNftsCacheKey(identifier);
      const getAccountStats = () =>
        this.apiService.getNftsCountForCollection(
          this.getQueryForCollection(identifier),
          identifier,
        );
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountStats,
        TimeConstants.oneDay,
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
      return { key: identifier, value: 0 };
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
    await this.redisCacheService.del(
      this.redisClient,
      this.getStatsCacheKey(identifier),
    );
    await this.redisCacheService.del(
      this.redisClient,
      this.getCollectionNftsCacheKey(identifier),
    );
  }
}
