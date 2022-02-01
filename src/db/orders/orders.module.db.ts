import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisCacheService } from 'src/common';
import { OrderEntity, OrdersProvider, OrdersServiceDb } from '.';
import { LastOrdersProvider } from './last-order.loader';
import { AvailableTokensForAuctionProvider } from './available-tokens-auction.loader';
import { AvailableTokensForAuctionRedisHandler } from './available-tokens-auctions.redis-handler';
import { LastOrderRedisHandler } from './last-order.redis-handler';
import { OrdersRedisHandler } from './orders.redis-handler';

@Module({
  imports: [TypeOrmModule.forFeature([OrderEntity])],
  providers: [
    RedisCacheService,
    AvailableTokensForAuctionRedisHandler,
    OrdersServiceDb,
    OrdersRedisHandler,
    OrdersProvider,
    LastOrderRedisHandler,
    LastOrdersProvider,
    AvailableTokensForAuctionProvider,
  ],
  exports: [
    RedisCacheService,
    AvailableTokensForAuctionRedisHandler,
    OrdersServiceDb,
    OrdersProvider,
    LastOrdersProvider,
    AvailableTokensForAuctionProvider,
  ],
})
export class OrdersModuleDb {}
