import { forwardRef, Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MarketplacesService } from './marketplaces.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { MarketplacesQueriesResolver } from './marketplaces-queries.resolver';
import { MarketplacesCachingService } from './marketplaces-caching.service';
import { NftMarketplaceAbiService } from '../auctions';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { CommonModule } from 'src/common.module';
import { MarketplaceProvider } from './loaders/marketplace.loader';
import { MarketplaceRedisHandler } from './loaders/marketplace.redis-handler';
import { MarketplaceEventsIndexingService } from './marketplaces-events-indexing.service';
import { OffersModuleGraph } from '../offers/offers.module';
import { AssetByIdentifierService } from '../assets';
import { MarketplacesReindexService } from './marketplaces-reindex.service';
import { ReindexAuctionStartedHandler } from './marketplaces-reindex-handlers/reindex-auction-started.handler';
import { ReindexAuctionBidHandler } from './marketplaces-reindex-handlers/reindex-auction-bid.handler';
import { ReindexAuctionBoughtHandler } from './marketplaces-reindex-handlers/reindex-auction-bought.handler';
import { ReindexAuctionEndedHandler } from './marketplaces-reindex-handlers/reindex-auction-ended.handler';
import { ReindexAuctionClosedHandler } from './marketplaces-reindex-handlers/reindex-auction-closed.handler';
import { ReindexOfferCreatedHandler } from './marketplaces-reindex-handlers/reindex-offer-created.hander';
import { ReindexOfferAcceptedHandler } from './marketplaces-reindex-handlers/reindex-offer-accepted.handler';
import { ReindexOfferClosedHandler } from './marketplaces-reindex-handlers/reindex-offer-closed.handler';
import { MarketplacesReindexEventsSummaryService } from './marketplaces-reindex-events-summary.service';
import { ReindexAuctionPriceUpdatedHandler } from './marketplaces-reindex-handlers/reindex-auction-price-updated.handler';
import { ReindexGlobalOfferAcceptedHandler } from './marketplaces-reindex-handlers/reindex-global-offer-accepted.handler';
import { ReindexAuctionUpdatedHandler } from './marketplaces-reindex-handlers/reindex-auction-updated.handler';
import { MarketplacesMutationsResolver } from './marketplaces-mutations.resolver';
import { DisabledMarketplaceEventsModule } from '../rabbitmq/blockchain-events/disable-marketplace/disable-marketplace-events.module';

@Module({
  providers: [
    Logger,
    MarketplacesQueriesResolver,
    MarketplacesMutationsResolver,
    MarketplacesService,
    MarketplacesCachingService,
    NftMarketplaceAbiService,
    MarketplaceProvider,
    MarketplaceRedisHandler,
    MarketplaceEventsIndexingService,
    AssetByIdentifierService,
    MarketplacesReindexService,
    MarketplacesReindexEventsSummaryService,
    ReindexAuctionStartedHandler,
    ReindexAuctionBidHandler,
    ReindexAuctionBoughtHandler,
    ReindexAuctionEndedHandler,
    ReindexAuctionClosedHandler,
    ReindexAuctionPriceUpdatedHandler,
    ReindexAuctionUpdatedHandler,
    ReindexOfferCreatedHandler,
    ReindexOfferAcceptedHandler,
    ReindexOfferClosedHandler,
    ReindexGlobalOfferAcceptedHandler,
  ],
  imports: [
    PubSubListenerModule,
    MxCommunicationModule,
    forwardRef(() => CommonModule),
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OffersModuleGraph),
    forwardRef(() => DisabledMarketplaceEventsModule),
  ],
  exports: [MarketplacesService, MarketplaceEventsIndexingService, MarketplacesReindexService],
})
export class MarketplacesModuleGraph {}
