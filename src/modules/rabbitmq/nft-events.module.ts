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
import { ElrondCommunicationModule } from 'src/common';
import { CampaignsModuleGraph } from '../campaigns/campaigns.module';
import { MinterEventsService } from './minter-events.service';

@Module({
  imports: [
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => CampaignsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => ElrondCommunicationModule),
  ],
  providers: [
    NftEventsConsumer,
    NftEventsService,
    MinterEventsService,
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
