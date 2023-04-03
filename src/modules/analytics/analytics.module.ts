import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { CommonModule } from 'src/common.module';
import { AnalyticsService } from './analytics.service';
import { BuyEventParser } from './buy-event.parser';
import { ElasticAnalyticsService } from './elastic.indexer.service';
import { AcceptOfferEventParser } from './acceptOffer-event.parser';
import { AnalyticsResolver } from './analytics.resolver';
import { AnalyticsGetterService } from './analytics.getter.service';
import { TimescaleDbModule } from 'src/common/persistence/timescaledb/timescaledb.module';

@Module({
  providers: [
    MarketplacesService,
    MarketplacesCachingService,
    AnalyticsService,
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
  exports: [AnalyticsService, ElasticAnalyticsService],
})
export class AnalyticsModule {}
