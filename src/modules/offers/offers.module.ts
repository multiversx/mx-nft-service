import { forwardRef, Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersResolver } from './offers.resolver';
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
import { AssetsModuleGraph } from '../assets/assets.module';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { NotificationsModuleGraph } from '../notifications/notifications.module';

@Module({
  providers: [
    OffersService,
    OffersResolver,
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
    forwardRef(() => AccountsStatsModuleGraph),
    forwardRef(() => NotificationsModuleGraph),
    forwardRef(() => AssetsModuleGraph),
    CacheEventsPublisherModule,
  ],
  exports: [OffersService],
})
export class OffersModuleGraph {}
