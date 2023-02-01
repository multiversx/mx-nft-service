import { Injectable } from '@nestjs/common';
import { AssetsRedisHandler } from 'src/modules/assets';
import { AssetScamInfoRedisHandler } from 'src/modules/assets/loaders/assets-scam-info.redis-handler';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { getCollectionAndNonceFromIdentifier } from 'src/utils/helpers';
import { rabbitExchanges, rabbitQueues } from './../rabbit-config';
import { PublicRabbitConsumer } from './../rabbitmq.consumers';
import { CacheInvalidationAdminService } from './cache-admin-module/cache-admin-invalidation.service';
import { CacheSetterAdminService } from './cache-admin-module/cache-admin-setter.service';
import { CacheInvalidationEventsService } from './cache-invalidation-module/cache-invalidation-events.service';
import { CacheEventTypeEnum, ChangedEvent } from './events/changed.event';

@Injectable()
export class CacheEventsConsumer {
  constructor(
    private cacheSetterAdminService: CacheSetterAdminService,
    private cacheInvalidationAdminService: CacheInvalidationAdminService,
    private assetsRedisHandler: AssetsRedisHandler,
    private collectionAssetsCount: CollectionAssetsCountRedisHandler,
    private collectionAssets: CollectionAssetsRedisHandler,
    private assetScamInfoRedisHandler: AssetScamInfoRedisHandler,
    private cacheInvalidationEventsService: CacheInvalidationEventsService,
  ) {}

  @PublicRabbitConsumer({
    connection: 'common',
    exchange: rabbitExchanges.CACHE_INVALIDATION,
    queueName: rabbitQueues.CACHE_INVALIDATION,
    disable: !(process.env.ENABLE_CACHE_INVALIDATION === 'true'),
  })
  async consume(event: ChangedEvent): Promise<void> {
    switch (event.type) {
      case CacheEventTypeEnum.OwnerChanged:
        await Promise.all([
          this.assetsRedisHandler.clearKey(event.id),
          this.cacheInvalidationEventsService.invalidateAssetHistory(event.id),
        ]);
        break;

      case CacheEventTypeEnum.AssetsRefresh:
        const collections = event.id.map((identifier) => {
          const { collection } =
            getCollectionAndNonceFromIdentifier(identifier);
          return collection;
        });
        await Promise.all([
          this.assetsRedisHandler.clearMultipleKeys(event.id),
          this.assetScamInfoRedisHandler.clearMultipleKeys(event.id),
          this.collectionAssets.clearMultipleKeys(collections),
        ]);
        break;

      case CacheEventTypeEnum.AssetRefresh:
        const { collection } = getCollectionAndNonceFromIdentifier(event.id);
        await Promise.all([
          this.assetsRedisHandler.clearKey(event.id),
          this.assetScamInfoRedisHandler.clearKey(event.id),
          this.collectionAssets.clearKey(collection),
        ]);
        break;

      case CacheEventTypeEnum.MarkCollection:
        await Promise.all([
          this.assetsRedisHandler.clearKeyByPattern(`${event.id}-`),
          this.assetScamInfoRedisHandler.clearKeyByPattern(`${event.id}-`),
          this.collectionAssets.clearKey(event.id),
        ]);
        break;

      case CacheEventTypeEnum.Mint:
        await this.collectionAssets.clearKey(event.id);
        await this.collectionAssetsCount.clearKey(event.id);
        break;

      case CacheEventTypeEnum.UpdateAuction:
        await Promise.all([
          this.cacheInvalidationEventsService.invalidateAuction(event),
          this.cacheInvalidationEventsService.invalidateAssetHistory(event.id),
        ]);
        break;

      case CacheEventTypeEnum.UpdateOrder:
        await this.cacheInvalidationEventsService.invalidateOrder(event);
        break;

      case CacheEventTypeEnum.UpdateNotifications:
        await this.cacheInvalidationEventsService.invalidateNotifications(
          event,
        );
        break;

      case CacheEventTypeEnum.UpdateOneNotification:
        await this.cacheInvalidationEventsService.invalidateOneNotification(
          event,
        );
        break;

      case CacheEventTypeEnum.AssetLike:
        await this.cacheInvalidationEventsService.invalidateAssetLike(event);
        break;

      case CacheEventTypeEnum.FeaturedCollections: {
        await this.cacheInvalidationEventsService.invalidateFeaturedCollectionsCache();
        break;
      }

      case CacheEventTypeEnum.BlacklistedCollections: {
        await this.cacheInvalidationEventsService.invalidateBlacklistedCollectionsCache();
        break;
      }

      case CacheEventTypeEnum.DeleteCacheKeys: {
        await this.cacheInvalidationAdminService.deleteCacheKeys(event);
        break;
      }

      case CacheEventTypeEnum.SetCacheKey: {
        await this.cacheSetterAdminService.setCacheKey(event);
        break;
      }
      case CacheEventTypeEnum.UpdateOffer:
        await this.cacheInvalidationEventsService.invalidateOffers(event);
        break;

      case CacheEventTypeEnum.RefreshTrending:
        await this.cacheInvalidationEventsService.invalidateTrendingAuctions(
          event,
        );
        break;
    }
  }
}
