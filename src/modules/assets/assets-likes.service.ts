import { Injectable, Logger } from '@nestjs/common';
import '../../utils/extensions';
import { AssetLikeEntity } from 'src/db/assets';
import { MxFeedService } from 'src/common/services/mx-communication/mx-feed.service';
import { EventEnum, Feed } from 'src/common/services/mx-communication/models/feed.dto';
import { AssetByIdentifierService } from './asset-by-identifier.service';
import { PersistenceService } from 'src/common/persistence/persistence.service';
import { Asset } from './models';
import { AssetsLikesCachingService } from './assets-likes.caching.service';
import {
  CacheEventsPublisherService,
  NftLikePublisherService,
} from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.service';
import { CacheEventTypeEnum, ChangedEvent } from '../rabbitmq/cache-invalidation/events/changed.event';
import { UserNftLikeEvent } from '../rabbitmq/cache-invalidation/events/userNftLike.event';

@Injectable()
export class AssetsLikesService {
  constructor(
    private persistenceService: PersistenceService,
    private assetByIdentifierService: AssetByIdentifierService,
    private accountFeedService: MxFeedService,
    private assetsLikesCachingService: AssetsLikesCachingService,
    private cacheEventsPublisherService: CacheEventsPublisherService,
    private nftLikePublisherService: NftLikePublisherService,
    private readonly logger: Logger,
  ) {}

  getAssetLiked(limit: number = 50, offset: number, address: string): Promise<[AssetLikeEntity[], number]> {
    try {
      const getAssetLiked = () => this.persistenceService.getAssetsLiked(limit, offset, address);
      return this.assetsLikesCachingService.getAssetLiked(address, getAssetLiked);
    } catch (err) {
      this.logger.error("An error occurred while loading asset's liked.", {
        path: 'AssetsService.getAssetLiked',
        address,
        exception: err,
      });
    }
  }

  async addLike(identifier: string, address: string, authorization?: string): Promise<boolean> {
    try {
      const isLiked = await this.persistenceService.isAssetLiked(identifier, address);
      if (isLiked) {
        return true;
      } else {
        await this.incremenLikesCount(identifier);
        await this.saveAssetLikeEntity(identifier, address);
        await this.invalidateAssetLike(identifier, address);
        await this.accountFeedService.subscribe(identifier, authorization);
        const nftData = await this.assetByIdentifierService.getAsset(identifier);
        await this.nftLikePublisherService.publish(new UserNftLikeEvent({ address, nftIdentifier: identifier }));
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

  async removeLike(identifier: string, address: string, authorization?: string): Promise<boolean> {
    try {
      const deleteResults = await this.persistenceService.removeLike(identifier, address);
      if (deleteResults.affected > 0) {
        await this.accountFeedService.unsubscribe(identifier, authorization);
        await this.decrementLikesCount(identifier);
        await this.invalidateAssetLike(identifier, address);
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
    try {
      const followersCount = await this.loadLikesCount(identifier);
      if (followersCount > 0) {
        return await this.assetsLikesCachingService.decrementLikesCount(identifier);
      }
      return 0;
    } catch (error) {
      this.logger.error("An error occurred while decrementing asset's likes.", {
        path: 'AssetsService.decrementLikesCount',
        identifier,
        exception: error,
      });
    }
  }

  async incremenLikesCount(identifier: string): Promise<number> {
    // Make sure that Redis Key is generated from DB.
    try {
      const likes = await this.loadLikesCount(identifier);
      return await this.assetsLikesCachingService.incremenLikesCount(identifier);
    } catch (error) {
      this.logger.error("An error occurred while incrementing asset's likes.", {
        path: 'AssetsService.incremenLikesCount',
        identifier,
        exception: error,
      });
    }
  }

  async loadLikesCount(identifier: string) {
    try {
      const getAssetLikesCount = () => this.persistenceService.getAssetLikesCount(identifier);
      return this.assetsLikesCachingService.loadLikesCount(identifier, getAssetLikesCount);
    } catch (error) {
      this.logger.error("An error occurred while loading asset's likes.", {
        path: 'AssetsService.loadLikesCount',
        identifier,
        exception: error,
      });
    }
  }

  async getMostLikedAssets(): Promise<Asset[]> {
    const getMostLikedAssets = async () => {
      const assetLikes = await this.persistenceService.getMostLikedAssetsIdentifiers();
      return await Promise.all(assetLikes.map((assetLikes) => this.assetByIdentifierService.getAsset(assetLikes.identifier)));
    };

    return await this.assetsLikesCachingService.getMostLikedAssets(getMostLikedAssets);
  }

  private async saveAssetLikeEntity(identifier: string, address: string): Promise<any> {
    try {
      const assetLikeEntity = this.buildAssetLikeEntity(identifier, address);
      return await this.persistenceService.addLike(assetLikeEntity);
    } catch (error) {
      await this.decrementLikesCount(identifier);
      throw error;
    }
  }

  private buildAssetLikeEntity(identifier: string, address: string): AssetLikeEntity {
    return new AssetLikeEntity({
      identifier,
      address,
    });
  }

  private async invalidateAssetLike(identifier: string, address: string): Promise<void> {
    await Promise.all([
      this.assetsLikesCachingService.invalidateCache(identifier, address),
      this.cacheEventsPublisherService.publish(
        new ChangedEvent({
          id: identifier,
          address: address,
          type: CacheEventTypeEnum.AssetLike,
        }),
      ),
    ]);
  }
}
