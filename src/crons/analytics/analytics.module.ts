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
import { TypeOrmModule } from '@nestjs/typeorm';
import * as ormconfig from 'src/ormconfig';
import { ConfigModule } from '@nestjs/config';

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
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    TimescaleDbModule,
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
  ],
  exports: [AnalyticsService, ElasticAnalyticsService],
})
export class AnalyticsModule {}
