import { Injectable } from '@nestjs/common';
import { AssetsRedisHandler } from 'src/modules/assets';
import { CollectionAssetsCountRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from 'src/modules/nftCollections/loaders/collection-assets.redis-handler';
import { PublicRabbitConsumer } from '../rabbitmq.consumers';
import { AuctionInvalidationEventsService } from './auction-events/auction-invalidation-events.service';
import { CacheEventTypeEnum, ChangedEvent } from './events/owner-changed.event';

@Injectable()
export class ChangedEventsConsumer {
  constructor(
    private assetsRedisHandler: AssetsRedisHandler,
    private collectionAssetsCount: CollectionAssetsCountRedisHandler,
    private collectionAssets: CollectionAssetsRedisHandler,
    private auctionInvalidation: AuctionInvalidationEventsService,
  ) {}

  @PublicRabbitConsumer({
    connection: 'common',
    exchange: 'cache-events',
    queueName: 'nft-cache-events',
  })
  async consume(event: ChangedEvent): Promise<void> {
    console.log(event);
    switch (event.type) {
      case CacheEventTypeEnum.OwnerChanged:
        console.log(2222222222222222);
        this.assetsRedisHandler.clearKey(event.id);
        break;

      case CacheEventTypeEnum.AssetsRefresh:
        this.assetsRedisHandler.clearMultipleKeys(event.id);
        break;

      case CacheEventTypeEnum.Mint:
        this.collectionAssets.clearKey(event.id);
        this.collectionAssetsCount.clearKey(event.id);
        break;

      case CacheEventTypeEnum.Bid:
        console.log(event);
        this.collectionAssets.clearKey(event.id);
        this.collectionAssetsCount.clearKey(event.id);
        break;

      case CacheEventTypeEnum.UpdateAuction:
        await this.auctionInvalidation.invalidateAuction(event);
        break;
    }
  }
}
