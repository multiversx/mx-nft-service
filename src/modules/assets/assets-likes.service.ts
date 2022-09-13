import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extentions';
import { AssetLikeEntity } from 'src/db/assets';
import { RedisCacheService } from 'src/common';
import * as Redis from 'ioredis';
import { generateCacheKeyFromParams } from 'src/utils/generate-cache-key';
import { cacheConfig } from 'src/config';
import { IsAssetLikedProvider } from './loaders/asset-is-liked.loader';
import { TimeConstants } from 'src/utils/time-utils';
import { ElrondFeedService } from 'src/common/services/elrond-communication/elrond-feed.service';
import {
  EventEnum,
  Feed,
} from 'src/common/services/elrond-communication/models/feed.dto';
import { AssetByIdentifierService } from './asset-by-identifier.service';
import { PersistenceService } from 'src/common/persistance/persistance.service';

@Injectable()
export class AssetsLikesService {
  private redisClient: Redis.Redis;
  private readonly ttl = 6 * TimeConstants.oneHour;
  constructor(
    private persistenceService: PersistenceService,
    private isAssetLikedLikeProvider: IsAssetLikedProvider,
    private assetByIdentifierService: AssetByIdentifierService,
    private readonly logger: Logger,
    private redisCacheService: RedisCacheService,
    private accountFeedService: ElrondFeedService,
  ) {
    this.redisClient = this.redisCacheService.getClient(
      cacheConfig.persistentRedisClientName,
    );
  }

  getAssetLiked(
    limit: number = 50,
    offset: number,
    address: string,
  ): Promise<[AssetLikeEntity[], number]> {
    try {
      const cacheKey = this.getAssetLikedByCacheKey(address);
      const getAssetLiked = () =>
        this.persistenceService.getAssetsLiked(limit, offset, address);
      return this.redisCacheService.getOrSet(
        this.redisClient,
        cacheKey,
        getAssetLiked,
        this.ttl,
      );
    } catch (err) {
      this.logger.error("An error occurred while loading asset's liked.", {
        path: 'AssetsService.getAssetLiked',
        address,
        exception: err,
      });
    }
  }

  async addLike(
    identifier: string,
    address: string,
    authorization?: string,
  ): Promise<boolean> {
    try {
      const isLiked = await this.persistenceService.isAssetLiked(
        identifier,
        address,
      );
      if (isLiked) {
        return true;
      } else {
        await this.incremenLikesCount(identifier);
        await this.saveAssetLikeEntity(identifier, address);
        await this.invalidateCache(identifier, address);
        await this.accountFeedService.subscribe(identifier, authorization);
        const nftData = await this.assetByIdentifierService.getAsset(
          identifier,
        );
        await this.accountFeedService.addFeed(
          new Feed({
            actor: address,
            event: EventEnum.like,
            reference: identifier,
            extraInfo: {
              nftName: nftData?.name,
              verified: nftData?.verified ? true : false,
            },
          }),
        );
        return true;
      }
    } catch (err) {
      this.logger.error('An error occurred while adding Asset Like.', {
        path: 'AssetsService.addLike',
        identifier,
        address,
        exception: err,
      });
      return await this.persistenceService.isAssetLiked(identifier, address);
    }
  }

  async removeLike(
    identifier: string,
    address: string,
    authorization?: string,
  ): Promise<boolean> {
    try {
      const deleteResults = await this.persistenceService.removeLike(
        identifier,
        address,
      );
      if (deleteResults.affected > 0) {
        await this.accountFeedService.unsubscribe(identifier, authorization);
        await this.decrementLikesCount(identifier);
        await this.invalidateCache(identifier, address);
      }
      return true;
    } catch (err) {
      this.logger.error('An error occurred while removing Asset Like.', {
        path: 'AssetsService.removeLike',
        identifier,
        address,
        exception: err,
      });
      return false;
    }
  }

  async decrementLikesCount(identifier: string): Promise<number> {
    // Make sure that Redis Key is generated from DB.
    const followersCount = await this.loadLikesCount(identifier);
    if (followersCount > 0) {
      return await this.redisCacheService.decrement(
        this.redisClient,
        this.getAssetLikesCountCacheKey(identifier),
        this.ttl,
      );
    }
    return 0;
  }

  async incremenLikesCount(identifier: string): Promise<number> {
    // Make sure that Redis Key is generated from DB.
    const likes = await this.loadLikesCount(identifier);
    return await this.redisCacheService.increment(
      this.redisClient,
      this.getAssetLikesCountCacheKey(identifier),
      this.ttl,
    );
  }

  async loadLikesCount(identifier: string) {
    return await this.redisCacheService.getOrSet(
      this.redisClient,
      this.getAssetLikesCountCacheKey(identifier),
      () => this.persistenceService.getAssetLikesCount(identifier),
      this.ttl,
    );
  }

  private getAssetLikedByCacheKey(address: string) {
    return generateCacheKeyFromParams('assetLiked', address);
  }

  private getAssetLikesCountCacheKey(identifier: string) {
    return generateCacheKeyFromParams('assetLikesCount', identifier);
  }

  private async invalidateCache(
    identifier: string,
    address: string,
  ): Promise<void> {
    await this.isAssetLikedLikeProvider.clearKey(`${identifier}_${address}`);
    await this.invalidateAssetLikeCache(identifier, address);
    await this.invalidateAssetLikedByCount(address);
  }

  private invalidateAssetLikedByCount(address: string): Promise<void> {
    const cacheKey = this.getAssetLikedByCacheKey(address);
    return this.redisCacheService.del(this.redisClient, cacheKey);
  }

  private invalidateAssetLikeCache(
    identifier: string,
    address: string,
  ): Promise<void> {
    const cacheKey = this.getAssetLikedCacheKey(identifier, address);
    return this.redisCacheService.del(this.redisClient, cacheKey);
  }

  private getAssetLikedCacheKey(identifier: string, address: string) {
    return generateCacheKeyFromParams('isAssetLiked', identifier, address);
  }

  private async saveAssetLikeEntity(
    identifier: string,
    address: string,
  ): Promise<any> {
    try {
      const assetLikeEntity = this.buildAssetLikeEntity(identifier, address);
      return await this.persistenceService.addLike(assetLikeEntity);
    } catch (error) {
      await this.decrementLikesCount(identifier);
      throw error;
    }
  }

  private buildAssetLikeEntity(
    identifier: string,
    address: string,
  ): AssetLikeEntity {
    return new AssetLikeEntity({
      identifier,
      address,
    });
  }
}
