import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { OrdersModuleDb } from '../orders/orders.module.db';
import { AuctionEntity } from '.';
import { AuctionsServiceDb } from './auctions.service.db';
import { AccountsStatsModuleGraph } from 'src/modules/account-stats/accounts-stats.module';
import { AuctionsForAssetRedisHandler } from 'src/modules/auctions';
import { AssetAuctionsCountRedisHandler } from 'src/modules/assets/loaders/asset-auctions-count.redis-handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([AuctionEntity]),
    OrdersModuleDb,
    AccountsStatsModuleGraph,
  ],
  providers: [
    AuctionsServiceDb,
    AuctionsForAssetRedisHandler,
    AssetAuctionsCountRedisHandler,
  ],
  exports: [AuctionsServiceDb, TypeOrmModule.forFeature([AuctionEntity])],
})
export class AuctionsModuleDb {}
