import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { CommonModule } from 'src/common.module';
import { TrendingCollectionsService } from './trending/trending-collections.service';
import { BuyEventParser } from './trending/buy-event.parser';
import { ElasticAnalyticsService } from './elastic.indexer.service';
import { AcceptOfferEventParser } from './trending/acceptOffer-event.parser';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsGetterService } from './analytics.getter.service';
import { TimescaleDbModule } from 'src/common/persistence/timescaledb/timescaledb.module';

@Module({
  providers: [
    MarketplacesService,
    MarketplacesCachingService,
    TrendingCollectionsService,
    ElasticAnalyticsService,
    BuyEventParser,
    AcceptOfferEventParser,
    AnalyticsResolver,
    AnalyticsGetterService,
  ],
  imports: [
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
    TimescaleDbModule,
  ],
  exports: [TrendingCollectionsService, ElasticAnalyticsService],
})
export class AnalyticsModule {}
