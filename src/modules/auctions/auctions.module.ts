import { forwardRef, Module } from '@nestjs/common';
import { AuctionsService, NftMarketplaceAbiService } from '.';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AssetsModuleGraph } from '../assets/assets.module';
import { OrdersService } from '../orders/order.service';
import { UsdAmountResolver } from './usd-amount.resolver';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AuctionsForAssetProvider } from './asset-auctions.loader';
import { AuctionOrdersResolver } from './auction-orders.resolver';
import { AuctionsForAssetRedisHandler } from './asset-auctions.redis-handler';
import { UsdPriceLoader } from './usd-price.loader';
import { UsdPriceRedisHandler } from './usd-price.redis-handler';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { AccountsStatsModuleGraph } from '../account-stats/accounts-stats.module';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { AssetstRedisHandler } from '../assets/loaders/assets.redis-handler';
import { AssetsProvider } from '../assets/loaders/assets.loader';
import { LastOrderRedisHandler } from '../orders/loaders/last-order.redis-handler';
import { AuctionsOrdersProvider } from './auction-orders.loader';
import { AuctionsOrdersRedisHandler } from './auction-orders.redis-handler';
import { AuctionProvider } from './auction.loader';
import { AuctionsRedisHandler } from './auctions.redis-handler';

@Module({
  providers: [
    AuctionsService,
    AuctionsResolver,
    UsdAmountResolver,
    AuctionOrdersResolver,
    NftMarketplaceAbiService,
    OrdersService,
    RedisCacheService,
    AuctionsForAssetRedisHandler,
    AuctionsForAssetProvider,
    AuctionsOrdersRedisHandler,
    AuctionsOrdersProvider,
    AuctionProvider,
    AuctionsRedisHandler,
    AssetstRedisHandler,
    AssetsProvider,
    UsdPriceRedisHandler,
    UsdPriceLoader,
    LastOrderRedisHandler,
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
