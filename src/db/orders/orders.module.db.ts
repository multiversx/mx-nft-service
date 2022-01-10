import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import {
  LastOrderProvider,
  OrderEntity,
  OrdersProvider,
  OrdersServiceDb,
} from '.';
import { AvailableTokensForAuctionProvider } from './available-tokens-auction.loader';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [
    OrdersServiceDb,
    OrdersProvider,
    LastOrderProvider,
    AvailableTokensForAuctionProvider,
    RedisCacheService,
  ],
  exports: [
    OrdersServiceDb,
    OrdersProvider,
    LastOrderProvider,
    AvailableTokensForAuctionProvider,
  ],
})
export class OrdersModuleDb {}
