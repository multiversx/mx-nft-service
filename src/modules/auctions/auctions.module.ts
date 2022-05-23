import { forwardRef, Module } from '@nestjs/common';
import {
  AuctionsSetterService,
  NftMarketplaceAbiService,
  AuctionsRedisHandler,
  AuctionsOrdersProvider,
  AuctionsOrdersRedisHandler,
  AuctionsGetterService,
} from '.';
import { AuctionsQueriesResolver } from './auctions-queries.resolver';
import { AuctionsMutationsResolver } from './auctions-mutations.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AssetsModuleGraph } from '../assets/assets.module';
import { OrdersService } from '../orders/order.service';
import { ElrondCommunicationModule } from 'src/common';
import { AuctionsForAssetProvider } from './loaders/asset-auctions.loader';
import { AuctionOrdersResolver } from './auction-orders.resolver';
import { AuctionsForAssetRedisHandler } from './loaders/asset-auctions.redis-handler';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { AccountsStatsModuleGraph } from '../account-stats/accounts-stats.module';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { AuctionProvider } from './loaders/auction.loader';
import { AssetsRedisHandler } from '../assets/loaders/assets.redis-handler';
import { AssetsProvider } from '../assets/loaders/assets.loader';
import { AvailableTokensForAuctionProvider } from './loaders/available-tokens-auction.loader';
import { AvailableTokensForAuctionRedisHandler } from './loaders/available-tokens-auctions.redis-handler';
import { LastOrderRedisHandler } from '../orders/loaders/last-order.redis-handler';
import { LastOrdersProvider } from '../orders/loaders/last-order.loader';

@Module({
  providers: [
    AuctionsSetterService,
    AuctionsGetterService,
    AuctionsQueriesResolver,
    AuctionsMutationsResolver,
    AuctionOrdersResolver,
    NftMarketplaceAbiService,
    OrdersService,
    AuctionsForAssetRedisHandler,
    AuctionsForAssetProvider,
    AvailableTokensForAuctionRedisHandler,
    AvailableTokensForAuctionProvider,
    AuctionsOrdersRedisHandler,
    AuctionsOrdersProvider,
    AuctionProvider,
    AuctionsRedisHandler,
    AssetsRedisHandler,
    AssetsProvider,
    LastOrderRedisHandler,
    LastOrdersProvider,
    AccountsProvider,
    AccountsRedisHandler,
  ],
  imports: [
    ElrondCommunicationModule,
    forwardRef(() => AuctionsModuleDb),
    forwardRef(() => AssetsModuleGraph),
    forwardRef(() => OrdersModuleDb),
    forwardRef(() => AccountsStatsModuleGraph),
  ],
  exports: [
    AuctionsSetterService,
    AuctionsGetterService,
    NftMarketplaceAbiService,
    OrdersService,
    AuctionsForAssetRedisHandler,
    AuctionsForAssetProvider,
    LastOrderRedisHandler,
  ],
})
export class AuctionsModuleGraph {}
