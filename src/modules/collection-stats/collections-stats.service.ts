import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AssetsQuery } from '../assets';
import { TimeConstants } from 'src/utils/time-utils';
import { CollectionStatsRepository } from 'src/db/collection-stats/collection-stats.repository';
import { CollectionStatsEntity } from 'src/db/collection-stats/collection-stats';

@Injectable()
export class CollectionsStatsService {
  private redisClient: Redis.Redis;
  constructor(
    private collectionStatsRepository: CollectionStatsRepository,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  async getStats(identifier: string): Promise<CollectionStatsEntity> {
    try {
      const cacheKey = this.getStatsCacheKey(identifier);
      const getCollectionStats = () =>
        this.collectionStatsRepository.getStats(identifier);
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
          exception: err?.message,
        },
      );
      return new CollectionStatsEntity();
    }
  }

  private getStatsCacheKey(identifier: string) {
    return generateCacheKeyFromParams('collection_stats', identifier);
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

  private getCollectionNftsCacheKey(key: string) {
    return generateCacheKeyFromParams('collectionAssetsCount', key);
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
