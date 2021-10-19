import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { AssetAuctionsCountProvider } from 'src/modules/assets';
import { AuctionsForAssetProvider } from 'src/modules/auctions/asset-auctions.loader';
import { OrdersModuleDb } from '../orders/orders.module.db';
import { AuctionEntity, AuctionsServiceDb } from '.';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionEntity]), OrdersModuleDb],
  providers: [
    AuctionsServiceDb,
    AuctionsForAssetProvider,
    AssetAuctionsCountProvider,
    RedisCacheService,
  ],
  exports: [AuctionsServiceDb, AuctionsForAssetProvider, RedisCacheService],
})
export class AuctionsModuleDb {}
