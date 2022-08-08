import { Injectable } from '@nestjs/common';
import { AssetsRedisHandler } from 'src/modules/assets';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { rabbitExchanges, rabbitQueues } from './../rabbit-config';
import { PublicRabbitConsumer } from './../rabbitmq.consumers';
import { CacheInvalidationEventsService } from './cache-invalidation-module/cache-invalidation-events.service';
import { CacheEventTypeEnum, ChangedEvent } from './events/owner-changed.event';

@Injectable()
export class CacheEventsConsumer {
  constructor(
    private assetsRedisHandler: AssetsRedisHandler,
    private collectionAssetsCount: CollectionAssetsCountRedisHandler,
    private collectionAssets: CollectionAssetsRedisHandler,
    private cacheInvalidationService: CacheInvalidationEventsService,
  ) {}

  @PublicRabbitConsumer({
    connection: 'common',
    exchange: rabbitExchanges.CACHE_INVALIDATION,
    queueName: rabbitQueues.CACHE_INVALIDATION,
    disable: process.env.ENABLE_CACHE_INVALIDATION === 'true' ? false : true,
  })
  async consume(event: ChangedEvent): Promise<void> {
    console.log(event);
    switch (event.type) {
      case CacheEventTypeEnum.OwnerChanged:
        this.assetsRedisHandler.clearKey(event.id);
        break;

      case CacheEventTypeEnum.AssetsRefresh:
        this.assetsRedisHandler.clearMultipleKeys(event.id);
        break;

      case CacheEventTypeEnum.Mint:
        this.collectionAssets.clearKey(event.id);
        this.collectionAssetsCount.clearKey(event.id);
        break;

      // case CacheEventTypeEnum.Bid:
      //   console.log(event);
      //   this.collectionAssets.clearKey(event.id);
      //   this.collectionAssetsCount.clearKey(event.id);
      //   break;

      case CacheEventTypeEnum.UpdateAuction:
        await this.cacheInvalidationService.invalidateAuction(event);
        break;

      case CacheEventTypeEnum.UpdateOrder:
        await this.cacheInvalidationService.invalidateOrder(event);
        break;
    }
  }
}
