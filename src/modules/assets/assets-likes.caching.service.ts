import { Injectable } from '@nestjs/common';
import '../../utils/extensions';
import { AssetLikeEntity } from 'src/db/assets';
import { RedisCacheService } from '@multiversx/sdk-nestjs-cache';
import { Constants } from '@multiversx/sdk-nestjs-common';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

import { CacheInfo } from 'src/common/services/caching/entities/cache.info';
import { Asset } from './models';
import { IsAssetLikedRedisHandler } from './loaders/asset-is-liked.redis-handler';

@Injectable()
export class AssetsLikesCachingService {
  private readonly ttl = 6 * Constants.oneHour();

  constructor(private isAssetLikedRedisHandler: IsAssetLikedRedisHandler, private redisCacheService: RedisCacheService) {}

  getAssetLiked(address: string, getAssetLiked: () => any): Promise<[AssetLikeEntity[], number]> {
    return this.redisCacheService.getOrSet(this.getAssetLikedByCacheKey(address), getAssetLiked, this.ttl);
  }

  async decrementLikesCount(identifier: string): Promise<number> {
    return await this.redisCacheService.decrement(this.getAssetLikesCountCacheKey(identifier), this.ttl);
  }

  async incremenLikesCount(identifier: string): Promise<number> {
    return await this.redisCacheService.increment(this.getAssetLikesCountCacheKey(identifier), this.ttl);
  }

  async loadLikesCount(identifier: string, loadLikesCountFunction: () => any) {
    return await this.redisCacheService.getOrSet(this.getAssetLikesCountCacheKey(identifier), loadLikesCountFunction, this.ttl);
  }

  async getMostLikedAssets(getMostLikedAssets: () => any): Promise<Asset[]> {
    return await this.redisCacheService.getOrSet(this.getMostLikedAssetsCacheKey(), getMostLikedAssets, CacheInfo.MostLikedAssets.ttl);
  }

  async invalidateCache(identifier: string, address: string): Promise<void> {
    await this.isAssetLikedRedisHandler.clearKey(`${identifier}_${address}`);
    await this.invalidateAssetLikeCache(identifier, address);
    await this.invalidateAssetLikedByCount(address);
  }

  private invalidateAssetLikedByCount(address: string): Promise<void> {
    const cacheKey = this.getAssetLikedByCacheKey(address);
    return this.redisCacheService.delete(cacheKey);
  }

  private invalidateAssetLikeCache(identifier: string, address: string): Promise<void> {
    const cacheKey = this.getAssetLikedCacheKey(identifier, address);
    return this.redisCacheService.delete(cacheKey);
  }

  private getAssetLikedCacheKey(identifier: string, address: string) {
    return generateCacheKeyFromParams('isAssetLiked', identifier, address);
  }

  private getAssetLikedByCacheKey(address: string) {
    return generateCacheKeyFromParams('assetLiked', address);
  }

  private getMostLikedAssetsCacheKey() {
    return generateCacheKeyFromParams(CacheInfo.MostLikedAssets.key);
  }

  private getAssetLikesCountCacheKey(identifier: string) {
    return generateCacheKeyFromParams('assetLikesCount', identifier);
  }
}
