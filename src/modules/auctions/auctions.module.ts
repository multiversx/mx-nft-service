import { forwardRef, Module } from '@nestjs/common';
import {
  AuctionsService,
  NftMarketplaceAbiService,
  AuctionsRedisHandler,
  AuctionsOrdersProvider,
  AuctionsOrdersRedisHandler,
} from '.';
import { AuctionsResolver } from './auctions.resolver';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { AssetsModuleGraph } from '../assets/assets.module';
import { OrdersService } from '../orders/order.service';
import { AssetsProvider, AssetstRedisHandler } from '../assets';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AuctionsForAssetProvider } from './loaders/asset-auctions.loader';
import { AuctionOrdersResolver } from './auction-orders.resolver';
import { AuctionsForAssetRedisHandler } from './loaders/asset-auctions.redis-handler';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { LastOrderRedisHandler } from 'src/db/orders/last-order.redis-handler';
import { AccountsStatsModuleGraph } from '../account-stats/accounts-stats.module';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { AuctionProvider } from './loaders/auction.loader';

@Module({
  providers: [
    AuctionsService,
    AuctionsResolver,
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
