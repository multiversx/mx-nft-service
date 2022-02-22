import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AuctionProvider, AuctionsRedisHandler } from '../auctions';
import { LastOrderRedisHandler } from 'src/db/orders/last-order.redis-handler';
import { AccountsStatsModuleGraph } from '../account-stats/accounts-stats.module';
import { AccountsProvider } from '../account-stats/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/accounts.redis-handler';

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
  ],
  imports: [
    ElrondCommunicationModule,
    OrdersModuleDb,
    forwardRef(() => AccountsStatsModuleGraph),
  ],
  exports: [OrdersService, RedisCacheService],
})
export class OrdersModuleGraph {}
