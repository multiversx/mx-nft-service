import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { AssetsQuery } from '../assets';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class CollectionsStatsService {
  private redisClient: Redis.Redis;
  constructor(
    private accountsStatsRepository: AccountStatsRepository,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.collectionsRedisClientName,
    );
  }

  async getStats(
    address: string,
    isOwner: boolean,
  ): Promise<AccountStatsEntity> {
    if (isOwner) {
      return this.getStatsForOwner(address);
    } else return this.getPublicStats(address);
  }

  private async getPublicStats(address: string): Promise<AccountStatsEntity> {
    try {
      const cacheKey = this.getStatsCacheKey(`${address}`);
      const getAccountStats = () =>
        this.accountsStatsRepository.getPublicAccountStats(address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountStats,
        5 * TimeConstants.oneMinute,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting stats for public account',
        {
          path: 'AccountsStatsService.getPublicStats',
          address,
          exception: err?.message,
        },
      );
      return new AccountStatsEntity();
    }
  }

  private async getStatsForOwner(address: string): Promise<AccountStatsEntity> {
    try {
      const cacheKey = this.getStatsCacheKey(`owner_${address}`);
      const getAccountStats = () =>
        this.accountsStatsRepository.getOnwerAccountStats(address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountStats,
        TimeConstants.oneHour,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting stats for owner account',
        {
          path: 'AccountsStatsService.getStatsForOwner',
          address,
          exception: err?.message,
        },
      );
      return new AccountStatsEntity();
    }
  }

  private getStatsCacheKey(address: string) {
    return generateCacheKeyFromParams('account_stats', address);
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

  public async invalidateStats(address: string) {
    await this.redisCacheService.del(
      this.redisClient,
      this.getStatsCacheKey(address),
    );
    await this.redisCacheService.del(
      this.redisClient,
      this.getCollectionNftsCacheKey(address),
    );
    return await this.redisCacheService.del(
      this.redisClient,
      this.getStatsCacheKey(`owner_${address}`),
    );
  }
}
