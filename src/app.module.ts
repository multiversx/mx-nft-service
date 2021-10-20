import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { GraphQLModule } from '@nestjs/graphql';
import 'reflect-metadata';
import { CollectionModuleGraph } from './modules/nftCollections/collection.module';
import { AssetsModuleGraph } from './modules/assets/assets.module';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { OrdersModuleGraph } from './modules/orders/orders.module';
import { AuctionsModuleDb } from './db/auctions/auctions.module.db';
import { AccountsModuleGraph } from './modules/accounts/accounts.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataLoaderInterceptor } from 'nestjs-graphql-dataloader';
import { AuthModule } from './modules/auth/auth.module';
import { loggerMiddleware } from './modules/metrics/logger-middleware';
import { CommonModule } from './common.module';
import { AssetHistoryModuleGraph } from './modules/asset-history/asset-history.module';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: DataLoaderInterceptor,
    },
  ],
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
      buildSchemaOptions: {
        fieldMiddleware: [loggerMiddleware],
      },
      sortSchema: true,
      playground: true,
      formatError: (error: GraphQLError) => {
        const graphQLFormattedError: GraphQLFormattedError = {
          ...error,
          message:
            error.extensions?.exception?.response?.message || error.message,
        };
        console.error(graphQLFormattedError);

        return graphQLFormattedError;
      },
      uploads: {
        maxFileSize: 100000000,
        maxFiles: 5,
      },
    }),
    CommonModule,
    CollectionModuleGraph,
    AssetsModuleGraph,
    AssetHistoryModuleGraph,
    AuctionsModuleGraph,
    OrdersModuleGraph,
    AccountsModuleGraph,
    AuctionsModuleDb,
    IpfsModule,
  ],
})
export class AppModule {}
