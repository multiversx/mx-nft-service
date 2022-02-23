import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { OrdersModuleDb } from '../orders/orders.module.db';
import { AuctionEntity } from '.';
import { AuctionsForAssetRedisHandler } from 'src/modules/auctions/asset-auctions.redis-handler';
import { AuctionsServiceDb } from './auctions.service.db';
import { AssetAuctionsCountRedisHandler } from 'src/modules/assets/loaders/asset-auctions-count.redis-handler';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionEntity])],
  providers: [
    AuctionsServiceDb,
    AuctionsForAssetRedisHandler,
    AssetAuctionsCountRedisHandler,
    RedisCacheService,
  ],
  exports: [AuctionsServiceDb, RedisCacheService],
})
export class AuctionsModuleDb {}
