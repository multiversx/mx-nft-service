import { forwardRef, Module } from '@nestjs/common';
import { NftEventsService } from './nft-events.service';
import { NftTransactionsConsumer as NftEventsConsumer } from './nft-events.consumer';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OrdersModuleGraph } from '../orders/orders.module';
import { RevertEventsConsumer } from './revert-events.consumer';
import { RevertEventsService } from './revert.events.service';
import { AvailableTokensForAuctionProvider } from 'src/db/orders/available-tokens-auction.loader';
import { AssetAvailableTokensCountProvider } from '../assets/asset-available-tokens-count.loader';

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
    AvailableTokensForAuctionProvider,
    AssetAvailableTokensCountProvider,
  ],
  exports: [NftEventsService],
})
export class NftTransactionsModule {}
