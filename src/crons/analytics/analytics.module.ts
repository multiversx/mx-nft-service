import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { CommonModule } from 'src/common.module';
import { AnalyticsService } from './analytics.service';
import { BuyEventParser } from './buy-event.parser';
import { ElasticAnalyticsService } from './elastic.indexer.service';
import { AcceptOfferEventParser } from './acceptOffer-event.parser';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { MarketplacesCachingService } from 'src/modules/marketplaces/marketplaces-caching.service';
import { MarketplacesService } from 'src/modules/marketplaces/marketplaces.service';
import { TimescaleDbModule } from 'src/common/persistence/timescaledb/timescaledb.module';

@Module({
  providers: [
    MarketplacesService,
    MarketplacesCachingService,
    AnalyticsService,
    ElasticAnalyticsService,
    BuyEventParser,
    AcceptOfferEventParser,
  ],
  imports: [
    TimescaleDbModule,
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
  ],
  exports: [AnalyticsService, ElasticAnalyticsService],
})
export class AnalyticsModule {}
