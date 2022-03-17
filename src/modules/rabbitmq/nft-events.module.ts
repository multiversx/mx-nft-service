import { forwardRef, Module } from '@nestjs/common';
import { NftEventsService } from './nft-events.service';
import { NftTransactionsConsumer as NftEventsConsumer } from './nft-events.consumer';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { RevertEventsConsumer } from './revert-events.consumer';
import { RevertEventsService } from './revert.events.service';
import { AssetAvailableTokensCountRedisHandler } from '../assets/loaders/asset-available-tokens-count.redis-handler';
import { AvailableTokensForAuctionRedisHandler } from '../auctions/loaders/available-tokens-auctions.redis-handler';
import { CollectionAssetsCountRedisHandler } from '../nftCollections/loaders/collection-assets-count.redis-handler';
import { CollectionAssetsRedisHandler } from '../nftCollections/loaders/collection-assets.redis-handler';
import { AssetsRedisHandler } from '../assets';

@Module({
  imports: [
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
  ],
  providers: [
    NftEventsConsumer,
    NftEventsService,
    RevertEventsConsumer,
    RevertEventsService,
    AvailableTokensForAuctionRedisHandler,
    AssetAvailableTokensCountRedisHandler,
    AssetsRedisHandler,
    CollectionAssetsCountRedisHandler,
    CollectionAssetsRedisHandler,
  ],
  exports: [NftEventsService],
})
export class NftTransactionsModule {}
