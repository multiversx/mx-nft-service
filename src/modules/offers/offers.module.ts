import { forwardRef, Module } from '@nestjs/common';
import { OffersService } from './offers.service';
import { OffersResolver } from './offers.resolver';
import { MxCommunicationModule } from 'src/common';
import { AuctionProvider, AuctionsRedisHandler } from '../auctions';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { AvailableTokensForAuctionRedisHandler } from '../auctions/loaders/available-tokens-auctions.redis-handler';
import { AssetsModuleGraph } from '../assets/assets.module';
import { CacheEventsPublisherModule } from '../rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import { NotificationsModuleGraph } from '../notifications/notifications.module';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { OffersCachingModule } from './caching/offers-caching.module';
import { AuthModule } from '../auth/auth.module';
import { MarketplaceProvider } from '../marketplaces/loaders/marketplace.loader';
import { MarketplaceRedisHandler } from '../marketplaces/loaders/marketplace.redis-handler';

@Module({
  providers: [
    OffersService,
    OffersResolver,
    AuctionProvider,
    AuctionsRedisHandler,
    AvailableTokensForAuctionRedisHandler,
    AccountsProvider,
    AccountsRedisHandler,
    MarketplaceRedisHandler,
    MarketplaceProvider,
  ],
  imports: [
    MxCommunicationModule,
    OffersCachingModule,
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => NotificationsModuleGraph),
    forwardRef(() => AssetsModuleGraph),
    forwardRef(() => AuthModule),
    CacheEventsPublisherModule,
  ],
  exports: [OffersService],
})
export class OffersModuleGraph {}
