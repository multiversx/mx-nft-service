import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import {
  ActiveOrdersProvider,
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
    ActiveOrdersProvider,
    AvailableTokensForAuctionProvider,
    RedisCacheService,
  ],
  exports: [
    OrdersServiceDb,
    OrdersProvider,
    ActiveOrdersProvider,
    AvailableTokensForAuctionProvider,
  ],
})
export class OrdersModuleDb {}
