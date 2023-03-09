import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { OrdersCachingService } from './orders-caching.service';
import { AccountsStatsCachingService } from 'src/modules/account-stats/accounts-stats.caching.service';
import { LastOrderRedisHandler } from '../loaders/last-order.redis-handler';
import { OrdersRedisHandler } from '../loaders/orders.redis-handler';
import { AvailableTokensForAuctionRedisHandler } from 'src/modules/auctions/loaders/available-tokens-auctions.redis-handler';

@Module({
  providers: [
    OrdersCachingService,
    AccountsStatsCachingService,
    LastOrderRedisHandler,
    OrdersRedisHandler,
    AvailableTokensForAuctionRedisHandler,
  ],
  imports: [CommonModule],
  exports: [OrdersCachingService],
})
export class OrdersCachingModule {}
