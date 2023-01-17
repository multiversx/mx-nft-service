import { Injectable, Logger } from '@nestjs/common';
import { AssetsRedisHandler } from 'src/modules/assets';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { rabbitExchanges, rabbitQueues } from './../rabbit-config';
import { PublicRabbitConsumer } from './../rabbitmq.consumers';
import { CacheInvalidationAdminService } from './cache-admin-module/cache-admin-invalidation.service';
import { CacheSetterAdminService } from './cache-admin-module/cache-admin-setter.service';
import { CacheInvalidationEventsService } from './cache-invalidation-module/cache-invalidation-events.service';
import { CacheEventTypeEnum, ChangedEvent } from './events/changed.event';

@Injectable()
export class CacheEventsConsumer {
  constructor(
    private readonly logger: Logger,
    private cacheSetterAdminService: CacheSetterAdminService,
    private cacheInvalidationAdminService: CacheInvalidationAdminService,
    private assetsRedisHandler: AssetsRedisHandler,
    private collectionAssetsCount: CollectionAssetsCountRedisHandler,
    private collectionAssets: CollectionAssetsRedisHandler,
    private cacheInvalidationEventsService: CacheInvalidationEventsService,
  ) {}

  @PublicRabbitConsumer({
    connection: 'common',
    exchange: rabbitExchanges.CACHE_INVALIDATION,
    queueName: rabbitQueues.CACHE_INVALIDATION,
    disable: !(process.env.ENABLE_CACHE_INVALIDATION === 'true'),
  })
  async consume(event: ChangedEvent): Promise<void> {
    this.logger.log(`Consume cache event - ${event.type}`);

    switch (event.type) {
      case CacheEventTypeEnum.OwnerChanged:
        await Promise.all([
          this.assetsRedisHandler.clearKey(event.id),
          this.cacheInvalidationEventsService.invalidateAssetHistory(event.id),
        ]);
        break;

      case CacheEventTypeEnum.AssetsRefresh:
        await this.assetsRedisHandler.clearMultipleKeys(event.id);
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

      case CacheEventTypeEnum.DeleteCacheKeys: {
        await this.cacheInvalidationAdminService.deleteCacheKeys(event);
        break;
      }

      case CacheEventTypeEnum.SetCacheKey: {
        await this.cacheSetterAdminService.setCacheKey(event);
        break;
      }
      case CacheEventTypeEnum.UpdateOffer:
        await this.cacheInvalidationEventsService.invalidateAuction(event);
        break;
    }
  }
}
