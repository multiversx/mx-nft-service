import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { OrdersModuleDb } from '../orders/orders.module.db';
import { AuctionEntity } from '.';
import { AssetAuctionsCountRedisHandler } from 'src/modules/assets/asset-auctions-count.redis-handler';
import { AuctionsServiceDb } from './auctions.service.db';
import { AccountsStatsModuleGraph } from 'src/modules/account-stats/accounts-stats.module';
import { AuctionsForAssetRedisHandler } from 'src/modules/auctions';

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
    RedisCacheService,
  ],
  exports: [AuctionsServiceDb, RedisCacheService],
})
export class AuctionsModuleDb {}
