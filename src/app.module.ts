import '../node_modules/@elrondnetwork/erdnest/lib/utils/extensions/number.extensions';
import { Module } from '@nestjs/common';
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
import { UsdAmountModuleGraph } from './modules/usdAmount/usd-amount.module';
import { TrendingModuleGraph } from './modules/trending/trending.module';
import { ReportNftsModuleGraph } from './modules/report-nfts/reports-nft.module';
import { CampaignsModuleGraph } from './modules/campaigns/campaigns.module';
import { CollectionsStatsModuleGraph } from './modules/collection-stats/collections-stats.module';
import { SearchModuleGraph } from './modules/search/search.module';
import { TagsModuleGraph } from './modules/tags/tags.module';
import { NftRarityModuleGraph } from './modules/nft-rarity/nft-rarity.module';
import { AdminOperationsModuleGraph } from './modules/admins/admin-operations.module';
import { NotificationsModuleGraph } from './modules/notifications/notifications.module';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
      introspection: process.env.NODE_ENV !== 'production',
      playground: true,
      sortSchema: true,
      formatError: (error: GraphQLError) => {
        const graphQLFormattedError: GraphQLFormattedError = {
          ...error,
          message:
            error.extensions?.exception?.response?.message || error.message,
        };
        console.error(graphQLFormattedError);

        return graphQLFormattedError;
      },
    }),
    CommonModule,
    CollectionsModuleGraph,
    AssetsModuleGraph,
    AssetHistoryModuleGraph,
    AuctionsModuleGraph,
    OrdersModuleGraph,
    OwnersModuleGraph,
    AccountsStatsModuleGraph,
    CollectionsStatsModuleGraph,
    ReportNftsModuleGraph,
    FeaturedModuleGraph,
    UsdAmountModuleGraph,
    TrendingModuleGraph,
    CampaignsModuleGraph,
    IpfsModule,
    SearchModuleGraph,
    TagsModuleGraph,
    NftRarityModuleGraph,
    AdminOperationsModuleGraph,
    NotificationsModuleGraph,
  ],
})
export class AppModule {}
