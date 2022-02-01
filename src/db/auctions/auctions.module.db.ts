import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import {
  AssetAuctionsCountProvider,
  AssetAuctionsCountRedisHandler,
} from 'src/modules/assets';
import { OrdersModuleDb } from '../orders/orders.module.db';
import { AuctionEntity, AuctionsServiceDb } from '.';
import { AuctionsForAssetProvider } from 'src/modules/auctions/asset-auctions.loader';
import { AuctionsForAssetRedisHandler } from 'src/modules/auctions/asset-auctions.redis-handler';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionEntity]), OrdersModuleDb],
  providers: [
    AuctionsServiceDb,
    AuctionsForAssetRedisHandler,
    AuctionsForAssetProvider,
    AssetAuctionsCountProvider,
    AssetAuctionsCountRedisHandler,
    RedisCacheService,
  ],
  exports: [AuctionsServiceDb, RedisCacheService],
})
export class AuctionsModuleDb {}
