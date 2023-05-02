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
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as ormconfig from 'src/ormconfig';
import { AnalyticsService } from './analytics.service';
import { AcceptOfferEventAnalyticsParser } from './acceptOffer-event-analytics.parser';
import { BuyEventAnalyticsParser } from './buy-event-analytics.parser';

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
    AnalyticsService,
    AcceptOfferEventAnalyticsParser,
    BuyEventAnalyticsParser,
  ],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
    TimescaleDbModule,
  ],
  exports: [
    TrendingCollectionsService,
    ElasticAnalyticsService,
    AnalyticsService,
  ],
})
export class AnalyticsModule {}
