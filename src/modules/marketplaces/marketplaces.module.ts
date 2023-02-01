import { forwardRef, Logger, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MarketplacesService } from './marketplaces.service';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { MarketplacesResolver } from './marketplaces.resolver';
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

@Module({
  providers: [
    Logger,
    MarketplacesResolver,
    MarketplacesService,
    MarketplacesCachingService,
    NftMarketplaceAbiService,
    MarketplaceProvider,
    MarketplaceRedisHandler,
    MarketplaceEventsIndexingService,
    AssetByIdentifierService,
    MarketplacesReindexService,
  ],
  imports: [
    PubSubListenerModule,
    MxCommunicationModule,
    forwardRef(() => CommonModule),
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => OffersModuleGraph),
  ],
  exports: [
    MarketplacesService,
    MarketplaceEventsIndexingService,
    MarketplacesReindexService,
  ],
})
export class MarketplacesModuleGraph {}
