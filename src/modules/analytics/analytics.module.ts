import { forwardRef, Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common';
import { AuctionsModuleGraph } from '../auctions/auctions.module';
import { CommonModule } from 'src/common.module';
import { TrendingCollectionsService } from './trending/trending-collections.service';
import { BuyEventParser } from './trending/buy-event.parser';
import { ElasticAnalyticsService } from './elastic.indexer.service';
import { AcceptOfferEventParser } from './trending/acceptOffer-event.parser';
import { AnalyticsGetterService } from './analytics.getter.service';
import { TimescaleDbModule } from 'src/common/persistence/timescaledb/timescaledb.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as ormconfig from 'src/ormconfig';
import { AnalyticsService } from './analytics.service';
import { AcceptOfferEventAnalyticsParser } from './events-parsers/acceptOffer-event-analytics.parser';
import { BuyEventAnalyticsParser } from './events-parsers/buy-event-analytics.parser';
import { GeneralAnalyticsResolver } from './general-analytics.resolver';
import { CollectionsModuleGraph } from '../nftCollections/collections.module';
import { GeneralAnalyticsService } from './general-analytics.service';
import { CollectionsAnalyticsResolver } from './collections-analytics.resolver';
import { CollectionsAnalyticsService } from './collections-analytics.service';
import { CollectionDetailsProvider } from './loaders/collection-details.loader';
import { CollectionDetailsRedisHandler } from './loaders/collection-details.redis-handler';
import { ListingAuctionAnalyticsHandler } from './events-parsers/listing-event-analytics.parser';
import { UpdateListingEventParser } from './events-parsers/updateListing-event.parser';
import { UpdatePriceEventParser } from './events-parsers/updatePrice-event.parser';
import { HoldersResolver } from './holders.resolver';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { MarketplacesModuleGraph } from '../marketplaces/marketplaces.module';

@Module({
  providers: [
    TrendingCollectionsService,
    ElasticAnalyticsService,
    BuyEventParser,
    AcceptOfferEventParser,
    AnalyticsGetterService,
    AnalyticsService,
    AcceptOfferEventAnalyticsParser,
    BuyEventAnalyticsParser,
    ListingAuctionAnalyticsHandler,
    GeneralAnalyticsResolver,
    GeneralAnalyticsService,
    CollectionsAnalyticsResolver,
    CollectionsAnalyticsService,
    CollectionDetailsProvider,
    CollectionDetailsRedisHandler,
    UpdatePriceEventParser,
    UpdateListingEventParser,
    AccountsProvider,
    AccountsRedisHandler,
    HoldersResolver,
  ],
  imports: [
    PubSubListenerModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    MxCommunicationModule,
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
    forwardRef(() => CollectionsModuleGraph),
    forwardRef(() => MarketplacesModuleGraph),
    TimescaleDbModule,
  ],
  exports: [TrendingCollectionsService, ElasticAnalyticsService, AnalyticsService, GeneralAnalyticsService, CollectionsAnalyticsService],
})
export class AnalyticsModule {}
