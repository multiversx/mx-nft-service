import { Module } from '@nestjs/common';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ConfigModule } from '@nestjs/config/dist';
import { GraphQLModule } from '@nestjs/graphql';
import 'reflect-metadata';
import { CollectionsModuleGraph } from './modules/nftCollections/collections.module';
import { AssetsModuleGraph } from './modules/assets/assets.module';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { OrdersModuleGraph } from './modules/orders/orders.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { AuthModule } from './modules/auth/auth.module';
import { CommonModule } from './common.module';
import { AssetHistoryModuleGraph } from './modules/asset-history/asset-history.module';
import { FeaturedModuleGraph } from './modules/featured/featured.module';
import { OwnersModuleGraph } from './modules/owners/owners.module';
import { AccountsStatsModuleGraph } from './modules/account-stats/accounts-stats.module';
import { UsdPriceModuleGraph } from './modules/usdPrice/usd-price.module';
import { TrendingModuleGraph } from './modules/trending/trending.module';
import { ReportsModuleGraph } from './modules/reports/reports.module';
import { CampaignsModuleGraph } from './modules/campaigns/campaigns.module';
import { CollectionsStatsModuleGraph } from './modules/collection-stats/collections-stats.module';
import { SearchModuleGraph } from './modules/search/search.module';
import { TagsModuleGraph } from './modules/tags/tags.module';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { NotificationsModuleGraph } from './modules/notifications/notifications.module';
import * as ormconfig from './ormconfig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplacesModuleGraph } from './modules/marketplaces/marketplaces.module';
import { ArtistsModuleGraph } from './modules/artists/artists.module';
import { ExploreStatsModuleGraph } from './modules/explore-stats/explore-stats.module';
import { ScamModule } from './modules/scam/scam.module';
import { ComplexityPlugin } from './modules/common/complexity.plugin';
import { BlacklistedCollectionsModule } from './modules/blacklist/blacklisted-collections.module';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/date.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/array.extensions';
import '@multiversx/sdk-nestjs-common/lib/utils/extensions/number.extensions';
import { TimescaleDbModule } from './common/persistence/timescaledb/timescaledb.module';
import { MintersModuleGraph } from './modules/minters/minters.module';
import { PersistenceModule } from './common/persistence/persistence.module';
import { ProxyDeployerModuleGraph } from './modules/proxy-deployer/proxy-deployer.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({ ...ormconfig, keepConnectionAlive: true }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [CommonModule],
      useFactory: async () => ({
        autoSchemaFile: 'schema.gql',
        introspection: process.env.NODE_ENV !== 'production',
        playground: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault(), new ComplexityPlugin()],
        sortSchema: true,
        formatError: (error: GraphQLError) => {
          const graphQLFormattedError: GraphQLFormattedError = {
            ...error,
            message: error.message,
          };
          console.error(graphQLFormattedError);

          return {
            ...graphQLFormattedError,
            extensions: { ...graphQLFormattedError.extensions, exception: null },
          };
        },
      }),
    }),
    CommonModule,
    PersistenceModule,
    CollectionsModuleGraph,
    AssetsModuleGraph,
    AssetHistoryModuleGraph,
    AuctionsModuleGraph,
    OrdersModuleGraph,
    OwnersModuleGraph,
    AccountsStatsModuleGraph,
    CollectionsStatsModuleGraph,
    ReportsModuleGraph,
    ScamModule,
    FeaturedModuleGraph,
    BlacklistedCollectionsModule,
    UsdPriceModuleGraph,
    TrendingModuleGraph,
    CampaignsModuleGraph,
    IpfsModule,
    SearchModuleGraph,
    TagsModuleGraph,
    NftRarityModuleGraph,
    AdminOperationsModuleGraph,
    NotificationsModuleGraph,
    MarketplacesModuleGraph,
    ArtistsModuleGraph,
    ExploreStatsModuleGraph,
    TimescaleDbModule,
    MintersModuleGraph,
    ProxyDeployerModuleGraph,
  ],
})
export class AppModule {}
