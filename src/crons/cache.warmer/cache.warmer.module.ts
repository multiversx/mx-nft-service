import { forwardRef, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { AuctionsModuleGraph } from 'src/modules/auctions/auctions.module';
import { CollectionsNftsCountRedisHandler } from 'src/modules/nftCollections/collection-nfts-count.redis-handler';
import { CollectionsNftsRedisHandler } from 'src/modules/nftCollections/collection-nfts.redis-handler';
import { PubSubListenerModule } from 'src/pubsub/pub.sub.listener.module';
import { AuctionsWarmerService } from './auctions.warmer.service';
import { CollectionsWarmerService } from './collections.warmer.service';
import * as ormconfig from './../../ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplacesModuleGraph } from 'src/modules/marketplaces/marketplaces.module';
import { TokensWarmerService } from './tokens.warmer.service';
import { XoxnoArtistsWarmerService } from './xoxno-minter-owners.warmer.service';
import { SmartContractArtistsService } from 'src/modules/artists/smart-contract-artist.service';
import { LikesWarmerService } from './likes.warmer.service';
import { AssetsModuleGraph } from 'src/modules/assets/assets.module';
import { CollectionsGetterService } from 'src/modules/nftCollections/collections-getter.service';
import { BlacklistedCollectionsModule } from 'src/modules/blacklist/blacklisted-collections.module';
import { AnalyticsModule } from 'src/modules/analytics/analytics.module';
import { TrendingCollectionsWarmerService } from './trendingCollections.warmer.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    CommonModule,
    forwardRef(() => AuctionsModuleGraph),
    PubSubListenerModule,
    MarketplacesModuleGraph,
    AssetsModuleGraph,
    BlacklistedCollectionsModule,
    AnalyticsModule,
  ],
  providers: [
    CollectionsGetterService,
    CollectionsNftsCountRedisHandler,
    CollectionsNftsRedisHandler,
    CollectionsWarmerService,
    SmartContractArtistsService,
    AuctionsWarmerService,
    TokensWarmerService,
    XoxnoArtistsWarmerService,
    LikesWarmerService,
    TrendingCollectionsWarmerService,
  ],
  exports: [CommonModule, TrendingCollectionsWarmerService],
})
export class CacheWarmerModule {}
