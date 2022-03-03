import { forwardRef, Module } from '@nestjs/common';
import {
  AuctionsService,
  NftMarketplaceAbiService,
  AuctionsRedisHandler,
  AuctionsOrdersProvider,
  AuctionsOrdersRedisHandler,
} from '.';
import { AuctionsQueriesResolver } from './auctions-queries.resolver';
import { AuctionsMutationsResolver } from './auctions-mutations.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AssetsModuleGraph } from '../assets/assets.module';
import { OrdersService } from '../orders/order.service';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AuctionsForAssetProvider } from './loaders/asset-auctions.loader';
import { AuctionOrdersResolver } from './auction-orders.resolver';
import { AuctionsForAssetRedisHandler } from './loaders/asset-auctions.redis-handler';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { AccountsStatsModuleGraph } from '../account-stats/accounts-stats.module';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { AuctionProvider } from './loaders/auction.loader';
import { AssetstRedisHandler } from '../assets/loaders/assets.redis-handler';
import { AssetsProvider } from '../assets/loaders/assets.loader';
import { AvailableTokensForAuctionProvider } from './loaders/available-tokens-auction.loader';
import { AvailableTokensForAuctionRedisHandler } from './loaders/available-tokens-auctions.redis-handler';
import { LastOrderRedisHandler } from '../orders/loaders/last-order.redis-handler';
import { LastOrdersProvider } from '../orders/loaders/last-order.loader';

@Module({
  providers: [
    AuctionsService,
    AuctionsQueriesResolver,
    AuctionsMutationsResolver,
    AuctionOrdersResolver,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsForAssetRedisHandler,
    AuctionsForAssetProvider,
    AvailableTokensForAuctionRedisHandler,
    AvailableTokensForAuctionProvider,
    AuctionsOrdersRedisHandler,
    AuctionsOrdersProvider,
    AuctionProvider,
    AuctionsRedisHandler,
    AssetstRedisHandler,
    AssetsProvider,
    LastOrderRedisHandler,
    LastOrdersProvider,
    AccountsProvider,
    AccountsRedisHandler,
  ],
  imports: [
    ElrondCommunicationModule,
    AuctionsModuleDb,
    forwardRef(() => AssetsModuleGraph),
    forwardRef(() => OrdersModuleDb),
    forwardRef(() => AccountsStatsModuleGraph),
  ],
  exports: [
    AuctionsService,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsForAssetRedisHandler,
    AuctionsForAssetProvider,
    LastOrderRedisHandler,
  ],
})
export class AuctionsModuleGraph {}
