import { forwardRef, Module } from '@nestjs/common';
import { NftEventsService } from './nft-events.service';
import { NftTransactionsConsumer as NftEventsConsumer } from './nft-events.consumer';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { RevertEventsConsumer } from './revert-events.consumer';
import { RevertEventsService } from './revert.events.service';
import { AssetAvailableTokensCountRedisHandler } from '../assets/asset-available-tokens-count.redis-handler';
import { AvailableTokensForAuctionRedisHandler } from 'src/db/orders/available-tokens-auctions.redis-handler';

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
  ],
  exports: [NftEventsService],
})
export class NftTransactionsModule {}
