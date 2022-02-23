import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AuctionProvider, AuctionsRedisHandler } from '../auctions';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { LastOrderRedisHandler } from './loaders/last-order.redis-handler';
import { OrdersRedisHandler } from './loaders/orders.redis-handler';
import { OrdersProvider } from './loaders/orders.loader';

@Module({
  providers: [
    OrdersService,
    OrdersResolver,
    RedisCacheService,
    AuctionProvider,
    AuctionsRedisHandler,
    LastOrderRedisHandler,
    AccountsProvider,
    AccountsRedisHandler,
    OrdersProvider,
    OrdersRedisHandler,
  ],
  imports: [forwardRef(() => OrdersModuleDb)],
  exports: [OrdersService, RedisCacheService, LastOrderRedisHandler],
})
export class OrdersModuleGraph {}
