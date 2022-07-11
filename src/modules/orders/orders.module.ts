import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './order.service';
import { OrdersResolver } from './orders.resolver';
import { OrdersModuleDb } from 'src/db/orders/orders.module.db';
import { ElrondCommunicationModule } from 'src/common';
import { AuctionProvider, AuctionsRedisHandler } from '../auctions';
import { AccountsStatsModuleGraph } from '../account-stats/accounts-stats.module';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { AvailableTokensForAuctionRedisHandler } from '../auctions/loaders/available-tokens-auctions.redis-handler';
import { LastOrderRedisHandler } from './loaders/last-order.redis-handler';
import { LastOrdersProvider } from './loaders/last-order.loader';
import { OrdersRedisHandler } from './loaders/orders.redis-handler';
import { OrdersProvider } from './loaders/orders.loader';
import { AuctionsModuleDb } from 'src/db/auctions/auctions.module.db';
import { NotificationsModuleDb } from 'src/db/notifications/notifications.module.db';
import { AssetsModuleGraph } from '../assets/assets.module';

@Module({
  providers: [
    OrdersService,
    OrdersResolver,
    AuctionProvider,
    AuctionsRedisHandler,
    LastOrderRedisHandler,
    LastOrdersProvider,
    OrdersRedisHandler,
    OrdersProvider,
    AvailableTokensForAuctionRedisHandler,
    AccountsProvider,
    AccountsRedisHandler,
  ],
  imports: [
    ElrondCommunicationModule,
    OrdersModuleDb,
    forwardRef(() => AccountsStatsModuleGraph),
    forwardRef(() => AuctionsModuleDb),
    forwardRef(() => NotificationsModuleDb),
    forwardRef(() => AssetsModuleGraph),
  ],
  exports: [OrdersService],
})
export class OrdersModuleGraph {}
