import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersModuleDb } from '../orders/orders.module.db';
import { AuctionEntity } from '.';
import { AuctionsServiceDb } from './auctions.service.db';
import { AccountsStatsModuleGraph } from 'src/modules/account-stats/accounts-stats.module';
import { AuctionsForAssetRedisHandler } from 'src/modules/auctions';
import { AssetAuctionsCountRedisHandler } from 'src/modules/assets/loaders/asset-auctions-count.redis-handler';
import { LowestAuctionRedisHandler } from 'src/modules/auctions/loaders/lowest-auctions.redis-handler';
import { AssetAvailableTokensCountRedisHandler } from 'src/modules/assets/loaders/asset-available-tokens-count.redis-handler';
import { OnSaleAssetsCountForCollectionRedisHandler } from 'src/modules/nftCollections/loaders/onsale-assets-count.redis-handler';
import { CacheEventsPublisherModule } from 'src/modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuctionEntity]),
    forwardRef(() => OrdersModuleDb),
    AccountsStatsModuleGraph,
    CacheEventsPublisherModule,
  ],
  providers: [
    AuctionsServiceDb,
    AuctionsForAssetRedisHandler,
    AssetAuctionsCountRedisHandler,
    LowestAuctionRedisHandler,
    OnSaleAssetsCountForCollectionRedisHandler,
    AssetAvailableTokensCountRedisHandler,
  ],
  exports: [AuctionsServiceDb, TypeOrmModule.forFeature([AuctionEntity])],
})
export class AuctionsModuleDb {}
