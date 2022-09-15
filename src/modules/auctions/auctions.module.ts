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
import { AssetsModuleGraph } from '../assets/assets.module';
import { ElrondCommunicationModule } from 'src/common';
import { AuctionsForAssetProvider } from './loaders/asset-auctions.loader';
import { AuctionOrdersResolver } from './auction-orders.resolver';
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
import { CommonModule } from 'src/common.module';
import { AuctionsCachingModule } from './caching/auctions-caching.module';
import { AuctionsCachingService } from './caching/auctions-caching.service';
import { MarketplacesModuleGraph } from '../marketplaces/marketplaces.module';
import { MarketplaceProvider } from '../marketplaces/loaders/marketplace.loader';
import { MarketplaceRedisHandler } from '../marketplaces/loaders/marketplace.redis-handler';
import { CachingService } from 'src/common/services/caching/caching.service';
import { ElrondNftSwapMarketplaceAbiService } from './elrondnftswap-marketplace.abi.service';
import { OrdersModuleGraph } from '../orders/orders.module';

@Module({
  providers: [
    AuctionsSetterService,
    AuctionsCachingService,
    AuctionsGetterService,
    AuctionsQueriesResolver,
    AuctionsMutationsResolver,
    AuctionOrdersResolver,
    NftMarketplaceAbiService,
    ElrondNftSwapMarketplaceAbiService,
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
    MarketplaceProvider,
    MarketplaceRedisHandler,
    CachingService,
  ],
  imports: [
    ElrondCommunicationModule,
    MarketplacesModuleGraph,
    CommonModule,
    forwardRef(() => AuctionsCachingModule),
    forwardRef(() => AssetsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => AccountsStatsModuleGraph),
  ],
  exports: [
    AuctionsSetterService,
    AuctionsGetterService,
    NftMarketplaceAbiService,
    AuctionsForAssetProvider,
    LastOrderRedisHandler,
  ],
})
export class AuctionsModuleGraph {}
