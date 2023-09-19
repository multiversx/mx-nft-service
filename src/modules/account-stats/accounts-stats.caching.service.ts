import { Injectable } from '@nestjs/common';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { AccountStatsEntity } from 'src/db/account-stats/account-stats';
import { CacheInfo } from 'src/common/services/caching/entities/cache.info';

@Injectable()
export class AccountsStatsCachingService {
  constructor(private redisCacheService: RedisCacheService) {}

  public async getPublicStats(address: string, getAccountStats: () => any): Promise<AccountStatsEntity> {
    return this.redisCacheService.getOrSet(this.getStatsCacheKey(address), () => getAccountStats(), CacheInfo.AccountStats.ttl);
  }

  public async getBiddingBalance(
    key: string,
    getBiddingBalanceStats: () => any,
  ): Promise<[{ biddingBalance: string; priceToken: string }]> {
    return this.redisCacheService.getOrSet(
      this.getBiddingBalanceCacheKey(key),
      () => getBiddingBalanceStats(),
      CacheInfo.AccountBidding.ttl,
    );
  }

  public async getStatsForOwner(address: string, getAccountStats: () => any): Promise<AccountStatsEntity> {
    return this.redisCacheService.getOrSet(this.getStatsCacheKey(`owner_${address}`), () => getAccountStats(), Constants.oneHour());
  }

  public async getClaimableCount(address: string, getClaimableCount: () => any): Promise<number> {
    return this.redisCacheService.getOrSet(
      this.getClaimableCacheKey(address),
      () => getClaimableCount(),
      CacheInfo.AccountClaimableCount.ttl,
    );
  }

  public async getLikesCount(address: string, getLikesCount: () => any): Promise<number> {
    return this.redisCacheService.getOrSet(this.getLikesCacheKey(address), () => getLikesCount(), CacheInfo.AccountLikesCount.ttl);
  }

  public async getCollectedCount(address: string, getCollectedCount: () => any): Promise<number> {
    return this.redisCacheService.getOrSet(this.getCollectedCacheKey(address), () => getCollectedCount(), CacheInfo.AccountCollected.ttl);
  }

  public async getCollectionsCount(address: string, getCollectionsCount: () => any): Promise<number> {
    return this.redisCacheService.getOrSet(
      generateCacheKeyFromParams('account_collections', address),
      () => getCollectionsCount(),
      5 * Constants.oneSecond(),
    );
  }

  public async getArtistCreationsInfo(
    address: string,
    getCreationsCount: () => any,
  ): Promise<{ artist: string; nfts: number; collections: string[] }> {
    return this.redisCacheService.getOrSet(
      generateCacheKeyFromParams('account_creations', address),
      () => getCreationsCount(),
      5 * Constants.oneSecond(),
    );
  }

  public async invalidateStats(address: string) {
    await this.redisCacheService.delete(this.getStatsCacheKey(address));
    await this.redisCacheService.delete(this.getClaimableCacheKey(address));
    await this.redisCacheService.delete(this.getStatsCacheKey(`owner_${address}`));
  }

  private getStatsCacheKey(address: string) {
    return generateCacheKeyFromParams(CacheInfo.AccountStats.key, address);
  }

  private getBiddingBalanceCacheKey(key: string) {
    return generateCacheKeyFromParams(CacheInfo.AccountBidding.key, key);
  }

  private getCollectedCacheKey(address: string) {
    return generateCacheKeyFromParams(CacheInfo.AccountCollected.key, address);
  }

  private getClaimableCacheKey(address: string) {
    return generateCacheKeyFromParams(CacheInfo.AccountClaimableCount.key, address);
  }
  private getLikesCacheKey(address: string) {
    return generateCacheKeyFromParams(CacheInfo.AccountLikesCount.key, address);
  }
}
