import { Injectable } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { cacheConfig } from 'src/config';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { TimeConstants } from 'src/utils/time-utils';

@Injectable()
export class AccountsStatsCachingService {
  private redisClient: Redis.Redis;
  constructor(private redisCacheService: RedisCacheService) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  public async getPublicStats(
    address: string,
    getAccountStats: () => any,
  ): Promise<AccountStatsEntity> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getStatsCacheKey(address),
      () => getAccountStats(),
      5 * TimeConstants.oneMinute,
    );
  }

  public async getStatsForOwner(
    address: string,
    getAccountStats: () => any,
  ): Promise<AccountStatsEntity> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getStatsCacheKey(`owner_${address}`),
      () => getAccountStats(),
      TimeConstants.oneHour,
    );
  }

  public async getClaimableCount(
    address: string,
    getClaimableCount: () => any,
  ): Promise<number> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getClaimableCacheKey(address),
      () => getClaimableCount(),
      5 * TimeConstants.oneSecond,
    );
  }

  public async getLikesCount(
    address: string,
    getLikesCount: () => any,
  ): Promise<number> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getLikesCacheKey(address),
      () => getLikesCount(),
      5 * TimeConstants.oneSecond,
    );
  }

  public async getCollectedCount(
    address: string,
    getCollectedCount: () => any,
  ): Promise<number> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      this.getCollectedCacheKey(address),
      () => getCollectedCount(),
      5 * TimeConstants.oneSecond,
    );
  }

  public async getCollectionsCount(
    address: string,
    getCollectionsCount: () => any,
  ): Promise<number> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      generateCacheKeyFromParams('account_collections', address),
      () => getCollectionsCount(),
      5 * TimeConstants.oneSecond,
    );
  }

  public async getArtistCreationsInfo(
    address: string,
    getCreationsCount: () => any,
  ): Promise<{ artist: string; nfts: number; collections: string[] }> {
    return this.redisCacheService.getOrSet(
      this.redisClient,
      generateCacheKeyFromParams('account_creations', address),
      () => getCreationsCount(),
      5 * TimeConstants.oneSecond,
    );
  }

  public async invalidateStats(address: string) {
    await this.redisCacheService.del(
      this.redisClient,
      this.getStatsCacheKey(address),
    );
    await this.redisCacheService.del(
      this.redisClient,
      this.getClaimableCacheKey(address),
    );
    return await this.redisCacheService.del(
      this.redisClient,
      this.getStatsCacheKey(`owner_${address}`),
    );
  }

  private getStatsCacheKey(address: string) {
    return generateCacheKeyFromParams('account_stats', address);
  }

  private getCollectedCacheKey(address: string) {
    return generateCacheKeyFromParams('account_collected', address);
  }

  private getClaimableCacheKey(address: string) {
    return generateCacheKeyFromParams('account_claimable_count', address);
  }
  private getLikesCacheKey(address: string) {
    return generateCacheKeyFromParams('account_likes_count', address);
  }
}
