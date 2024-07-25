import { Logger, Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from './common.module';
import { CachingController } from './common/services/caching/caching.controller';
import { NsfwUpdaterService } from './crons/elastic.updater/nsfw.updater.service';
import { RarityUpdaterService } from './crons/elastic.updater/rarity.updater.service';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { AuthModule } from './modules/auth/auth.module';
import { ReindexController } from './modules/ingress/reindex.controller';
import { MarketplacesModuleGraph } from './modules/marketplaces/marketplaces.module';
import { MetricsController } from './modules/metrics/metrics.controller';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';
import { ScamModule } from './modules/scam/scam.module';
import { NftTraitsModule } from './modules/nft-traits/nft-traits.module';
import { CacheEventsPublisherModule } from './modules/rabbitmq/cache-invalidation/cache-invalidation-publisher/change-events-publisher.module';
import * as ormconfig from './ormconfig';
import { FeedEventsSenderService } from './modules/rabbitmq/blockchain-events/feed-events.service';
import { AcceptGlobalOfferEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/acceptGlobalOffer-event.handler';
import { AcceptOfferEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/acceptOffer-event.handler';
import { BidEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/bid-event.handler';
import { BuyEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/buy-event.handler';
import { EndAuctionEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/endAuction-event.handler';
import { SendOfferEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/sendOffer-event.handler';
import { StartAuctionEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/startAuction-event.handler';
import { SwapUpdateEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/swapUpdate-event.handler';
import { UpdateListingEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/updateListing-event.handler';
import { UpdatePriceEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/updatePrice-event.handler';
import { WithdrawAuctionEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/withdrawAuction-event.handler';
import { WithdrawOfferEventHandler } from './modules/rabbitmq/blockchain-events/handlers-reindex/withdrawOffer-event.handler';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { NotificationsModuleGraph } from './modules/notifications/notifications.module';
import { OffersModuleGraph } from './modules/offers/offers.module';
import { OrdersModuleGraph } from './modules/orders/orders.module';
import { MarketplaceEventsProcessingService } from './modules/rabbitmq/blockchain-events/marketplace-events-processing.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    AdminOperationsModuleGraph,
    NftRarityModuleGraph,
    CacheEventsPublisherModule,
    ScamModule,
    NftTraitsModule,
    MarketplacesModuleGraph,
    AuthModule,
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OrdersModuleGraph),
    forwardRef(() => NotificationsModuleGraph),
    forwardRef(() => OffersModuleGraph),
  ],
  providers: [
    Logger,
    NsfwUpdaterService,
    RarityUpdaterService,
    MarketplaceEventsProcessingService,
    BuyEventHandler,
    BidEventHandler,
    StartAuctionEventHandler,
    EndAuctionEventHandler,
    WithdrawAuctionEventHandler,
    AcceptGlobalOfferEventHandler,
    SendOfferEventHandler,
    AcceptOfferEventHandler,
    WithdrawOfferEventHandler,
    UpdatePriceEventHandler,
    UpdateListingEventHandler,
    SwapUpdateEventHandler,
    FeedEventsSenderService,
  ],
  controllers: [MetricsController, ReindexController, CachingController],
  exports: [NsfwUpdaterService, RarityUpdaterService],
})
export class PrivateAppModule { }
