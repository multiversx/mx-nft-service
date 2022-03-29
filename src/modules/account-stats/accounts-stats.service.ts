import { Inject, Injectable } from '@nestjs/common';
import { ElrondApiService, RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AccountStatsRepository } from 'src/db/account-stats/account-stats.repository';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats.entity';
import { AssetsQuery } from '../assets';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class AccountsStatsService {
  private redisClient: Redis.Redis;
  constructor(
    private accountsStatsRepository: AccountStatsRepository,
    private apiService: ElrondApiService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }

  async getStats(address: string, isOwner: boolean): Promise<any> {
    if (isOwner) {
      return this.getStatsForOwner(address);
    } else return this.getPublicStats(address);
  }

  private async getPublicStats(address: string): Promise<any> {
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
      return Promise.resolve(AccountStatsEntity);
    }
  }

  private async getStatsForOwner(address: string): Promise<any> {
    try {
      const cacheKey = this.getStatsCacheKey(`owner_${address}`);
      const getAccountStats = () =>
        this.accountsStatsRepository.getOnwerAccountStats(address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountStats,
        TimeConstants.oneDay,
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
      return Promise.resolve(AccountStatsEntity);
    }
  }

  private getStatsCacheKey(address: string) {
    return generateCacheKeyFromParams('account_stats', address);
  }

  async getClaimableCount(address: string): Promise<any> {
    try {
      const cacheKey = this.getClaimableCacheKey(address);
      const getAccountClaimableCount = () =>
        this.accountsStatsRepository.getAccountClaimableCount(address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountClaimableCount,
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error(
        'An error occurred while getting claimable count for account',
        {
          path: 'AccountsStatsService.getClaimableCount',
          address,
          exception: err?.message,
        },
      );
      return Promise.resolve(AccountStatsEntity);
    }
  }

  private getClaimableCacheKey(address: string) {
    return generateCacheKeyFromParams('account_claimable_count', address);
  }

  async getCollectedCount(address: string): Promise<any> {
    try {
      const cacheKey = this.getCollectedCacheKey(address);
      const getAccountStats = () =>
        this.apiService.getNftsForUserCount(address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountStats,
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting collected count', {
        path: 'AccountsStatsService.getCollectedCount',
        address,
        exception: err?.message,
      });
      return Promise.resolve(AccountStatsEntity);
    }
  }

  private getCollectedCacheKey(address: string) {
    return generateCacheKeyFromParams('account_collected', address);
  }

  async getCollectionsCount(address: string): Promise<any> {
    try {
      const cacheKey = this.getCollectionsCacheKey(address);
      const getCollectionsCount = () =>
        this.apiService.getCollectionsForAddressCount(address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getCollectionsCount,
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting collections Count ', {
        path: 'AccountsStatsService.getCollectionsCount',
        address,
        exception: err?.message,
      });
      return Promise.resolve(AccountStatsEntity);
    }
  }

  private getCollectionsCacheKey(address: string) {
    return generateCacheKeyFromParams('account_collections', address);
  }

  async getCreationsCount(address: string): Promise<any> {
    try {
      const query = new AssetsQuery()
        .addCreator(address)
        .withSupply()
        .withOwner()
        .build();
      const cacheKey = this.getCreationsCacheKey(address);
      const getAccountStats = () => this.apiService.getNftsCount(query);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountStats,
        5 * TimeConstants.oneSecond,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting creations count', {
        path: 'AccountsStatsService.getCreationsCount',
        address,
        exception: err?.message,
      });
      return Promise.resolve(AccountStatsEntity);
    }
  }

  private getCreationsCacheKey(address: string) {
    return generateCacheKeyFromParams('account_creations', address);
  }

  public async invalidateStats(address: string) {
    await this.redisCacheService.del(
      this.redisClient,
      this.getStatsCacheKey(address),
    );
    return await this.redisCacheService.del(
      this.redisClient,
      this.getStatsCacheKey(`owner_${address}`),
    );
  }
}
