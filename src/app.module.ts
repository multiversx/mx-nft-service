import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { GraphQLModule } from '@nestjs/graphql';
import 'reflect-metadata';
import { CollectionModuleGraph } from './modules/nftCollections/collection.module';
import { AssetsModuleGraph } from './modules/assets/assets.module';
import { AuctionsModuleGraph } from './modules/auctions/auctions.module';
import { OrdersModuleGraph } from './modules/orders/orders.module';
import { AuctionsModuleDb } from './db/auctions/auctions.module';
import { AccountsModuleGraph } from './modules/accounts/accounts.module';
import { IpfsModule } from './modules/ipfs/ipfs.module';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DataLoaderInterceptor } from 'nestjs-graphql-dataloader';
import { assetAuctionLoader } from './db/auctions/asset-auction.loader';
import { acountAuctionLoader } from './db/auctions/account-auction.loader';
import { auctionOrdersLoader } from './db/orders/auction-orders.loader';
import { auctionLoaderById } from './db/auctions/auctionLoaderById';
import { AuthModule } from './modules/auth/auth.module';
import { loggerMiddleware } from './modules/metrics/logger-middleware';
import { CommonModule } from './common.module';
import { auctionActiveOrdersLoader } from './db/orders/auction-activeOrders.loader';

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
      context: () => ({
        assetAuctionLoader: assetAuctionLoader(),
        auctionLoaderById: auctionLoaderById(),
        acountAuctionLoader: acountAuctionLoader(),
        auctionOrdersLoader: auctionOrdersLoader(),
        auctionActiveOrdersLoader: auctionActiveOrdersLoader(),
      }),
    }),
    CommonModule,
    CollectionModuleGraph,
    AssetsModuleGraph,
    AuctionsModuleGraph,
    OrdersModuleGraph,
    AccountsModuleGraph,
    AuctionsModuleDb,
    IpfsModule,
  ],
})
export class AppModule {}
