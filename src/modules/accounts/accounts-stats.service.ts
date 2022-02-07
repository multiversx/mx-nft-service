import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AccountStatsRepository } from 'src/db/assets/account-stats.repository';

@Injectable()
export class AccountsStatsService {
  private redisClient: Redis.Redis;
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private accountsStatsRepository: AccountStatsRepository,
    private redisCacheService: RedisCacheService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.followersRedisClientName,
    );
  }
  async getStats(addresses: string[]): Promise<any> {
    try {
      const cacheKey = 'this.getFollowersCacheKey(addresses[0])';
      const getAccountsStats = () =>
        this.accountsStatsRepository.getAccountStats(addresses);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAccountsStats,
        cacheConfig.followersttl,
      );
    } catch (err) {
      this.logger.error('An error occurred while getting all followers', {
        path: 'AccountsService.getFollowers',
        addresses,
        exception: err,
      });
      return Promise.resolve([[], 0]);
    }
  }

  private getFollowersCacheKey(
    identifier: string,
    offset: number,
    limit: number,
  ) {
    return generateCacheKeyFromParams('followers', identifier, offset, limit);
  }

  private getFollowingCacheKey(
    identifier: string,
    offset: number,
    limit: number,
  ) {
    return generateCacheKeyFromParams('following', identifier, offset, limit);
  }

  private async invalidateFollowersKey(address: string): Promise<void> {
    const cacheKey = generateCacheKeyFromParams('followers', address);
    return await this.redisCacheService.delByPattern(
      this.redisClient,
      `${cacheKey}_*`,
    );
  }

  private async invalidateFollowingKey(address: string): Promise<void> {
    const cacheKey = generateCacheKeyFromParams('following', address);
    return await this.redisCacheService.delByPattern(
      this.redisClient,
      `${cacheKey}_*`,
    );
  }
}
