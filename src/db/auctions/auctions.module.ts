import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { AuctionsForAssetProvider } from 'src/modules/auctions/asset-auctions.loader';
import { OrdersModuleDb } from '../orders/orders.module';
import { AuctionEntity } from './auction.entity';
import { AuctionsServiceDb } from './auctions.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuctionEntity]), OrdersModuleDb],
  providers: [AuctionsServiceDb, AuctionsForAssetProvider, RedisCacheService],
  exports: [AuctionsServiceDb, AuctionsForAssetProvider, RedisCacheService],
})
export class AuctionsModuleDb {}
