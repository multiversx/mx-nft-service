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

  getAssetLikesCount(identifier: string,
    nonce: number): Promise<number> {
    try {
      const cacheKey = this.getAssetLikesCountCacheKey(identifier, nonce);
      const getAssetLikes = () => this.assetsLikesRepository.getAssetLikesCount(identifier, nonce);
      return this.redisCacheService.getOrSet(cacheKey, getAssetLikes, 300);
    } catch (err) {
      this.logger.error('An error occurred while loading asset\'s likes count.', {
        path: 'AssetsService.getAssetLikesCount',
        identifier,
        nonce,
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

  private getAssetLikesCountCacheKey(token: string, nonce: number) {
    return generateCacheKeyFromParams('assetLikesCount', token, nonce);
  }

  private async invalidateCache(token: string, nonce: number,
    address: string): Promise<void> {
    await this.invalidateAssetLikeCache(token, nonce, address);
    await this.invalidateAssetLikesCount(token, nonce);
  }

  private invalidateAssetLikesCount(token: string, nonce: number): Promise<void> {
    const cacheKey = this.getAssetLikesCountCacheKey(token, nonce);
    return this.redisCacheService.del(cacheKey);
  }

  private invalidateAssetLikeCache(token: string, nonce: number,
    address: string): Promise<void> {
    const cacheKey = this.getAssetLikedCacheKey(token, nonce, address);
    return this.redisCacheService.del(cacheKey);
  }

  private getAssetLikedCacheKey(token: string,
                                nonce: number,
                                address: string) {
    return generateCacheKeyFromParams('isAssetLiked', token, nonce, address);
  }

  private saveAssetLikeEntity(token: string,
                              nonce: number,
                              address: string): Promise<any> {
    const assetLikeEntity = this.buildAssetLikeEntity(token, nonce, address);
    return this.assetsLikesRepository.addLike(assetLikeEntity);
  }

  private buildAssetLikeEntity(token: string,
                               nonce: number,
                               address: string): AssetLikeEntity {
    return new AssetLikeEntity(
      {
        token,
        nonce,
        address
      });
  }
}
