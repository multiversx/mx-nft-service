import { Inject, Injectable } from '@nestjs/common';
import { AssetLikeEntity } from 'src/db/assets/assets-likes.entity';
import { AssetsLikesRepository } from 'src/db/assets/assets-likes.repository';
import '../../utils/extentions';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';

@Injectable()
export class AssetsLikesService {
  constructor(
    private assetsLikesRepository: AssetsLikesRepository,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private redisCacheService: RedisCacheService
  ) { }

  getAssetLikesCount(tokenIdentifier: string,
    tokenNonce: number): Promise<number> {
    try {
      const cacheKey = this.getAssetLikesCountCacheKey(tokenIdentifier, tokenNonce);
      const getAssetLikes = () => this.assetsLikesRepository.getAssetLikesCount(tokenIdentifier, tokenNonce);
      return this.redisCacheService.getOrSet(cacheKey, getAssetLikes, 300);
    } catch (err) {
      this.logger.error('An error occurred while loading asset\'s likes count.', {
        path: 'AssetsService.getAssetLikesCount',
        tokenIdentifier,
        tokenNonce,
      });
    }
  }

  isAssetLiked(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<boolean> {
    try {
      const cacheKey = this.getAssetLikedCacheKey(tokenIdentifier, tokenNonce, address);
      const getIsAssetLiked = () => this.assetsLikesRepository.isAssetLiked(tokenIdentifier, tokenNonce, address);
      return this.redisCacheService.getOrSet(cacheKey, getIsAssetLiked, 300);
    } catch (err) {
      this.logger.error('An error occurred while checking if asset is liked.', {
        path: 'AssetsService.isAssetLiked',
        tokenIdentifier,
        tokenNonce,
        address
      });
      return Promise.resolve(false);
    }
  }

  async addLike(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<boolean> {
    try {
      await this.saveAssetLikeEntity(tokenIdentifier, tokenNonce, address);
      this.invalidateCache(tokenIdentifier, tokenNonce, address);
      return true;
    }
    catch (err) {
      this.logger.error('An error occurred while adding Asset Like.', {
        path: 'AssetsService.addLike',
        tokenIdentifier,
        tokenNonce,
        address
      });
      return false;
    }
  }

  async removeLike(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<any> {
    try {
      await this.assetsLikesRepository.removeLike(tokenIdentifier, tokenNonce, address);
      await this.invalidateCache(tokenIdentifier, tokenNonce, address);
      return true;
    } catch (err) {
      this.logger.error('An error occurred while removing Asset Like.', {
        path: 'AssetsService.removeLike',
        tokenIdentifier,
        tokenNonce,
        address
      });
      return false;
    }
  }

  private getAssetLikesCountCacheKey(tokenIdentifier: string,
    tokenNonce: number) {
    return generateCacheKeyFromParams('assetLikesCount', tokenIdentifier, tokenNonce);
  }

  private async invalidateCache(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<void> {
    await this.invalidateAssetLikeCache(tokenIdentifier, tokenNonce, address);
    await this.invalidateAssetLikesCount(tokenIdentifier, tokenNonce);
  }

  private invalidateAssetLikesCount(tokenIdentifier: string,
    tokenNonce: number): Promise<void> {
    const cacheKey = this.getAssetLikesCountCacheKey(tokenIdentifier, tokenNonce);
    return this.redisCacheService.del(cacheKey);
  }

  private invalidateAssetLikeCache(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<void> {
    const cacheKey = this.getAssetLikedCacheKey(tokenIdentifier, tokenNonce, address);
    return this.redisCacheService.del(cacheKey);
  }

  private getAssetLikedCacheKey(tokenIdentifier: string,
    tokenNonce: number,
    address: string) {
    return generateCacheKeyFromParams('isAssetLiked', tokenIdentifier, tokenNonce, address);
  }

  private saveAssetLikeEntity(tokenIdentifier: string,
    tokenNonce: number,
    address: string): Promise<any> {
    const assetLikeEntity = this.buildAssetLikeEntity(tokenIdentifier, tokenNonce, address);
    return this.assetsLikesRepository.addLike(assetLikeEntity);
  }

  private buildAssetLikeEntity(tokenIdentifier: string,
    tokenNonce: number,
    address: string): AssetLikeEntity {
    return new AssetLikeEntity(
      {
        tokenIdentifier,
        tokenNonce,
        address
      });
  }
}
