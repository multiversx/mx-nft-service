import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { MarketplacesService } from '../marketplaces/marketplaces.service';
import { MarketplacesCachingService } from '../marketplaces/marketplaces-caching.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ElasticAnalyticsService } from '../analytics/elastic.indexer.service';
import { BuyEventParser } from './buy-event.parser';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { CommonModule } from 'src/common.module';

@Module({
  providers: [
    MarketplacesService,
    MarketplacesCachingService,
    AnalyticsService,
    ElasticAnalyticsService,
    BuyEventParser,
  ],
  imports: [
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
  ],
  exports: [AnalyticsService, ElasticAnalyticsService],
})
export class AnalyticsModule {}
