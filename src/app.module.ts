import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { ScheduleModule } from '@nestjs/schedule';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { RedisModule } from 'nestjs-redis';
import { cacheConfig } from './config';
import { AuthModule } from './modules/auth/auth.module';

const logTransports: Transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      nestWinstonModuleUtilities.format.nestLike(),
    ),
  }),
];

const logLevel = !!process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'error';

if (!!process.env.LOG_FILE) {
  logTransports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE,
      dirname: 'logs',
      maxsize: 100000,
      level: logLevel,
    }),
  );
}

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
    WinstonModule.forRoot({
      transports: logTransports,
    }),
    TypeOrmModule.forRoot({}),
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
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
        randomValue: Math.random(),
        assetAuctionLoader: assetAuctionLoader(),
        auctionLoaderById: auctionLoaderById(),
        acountAuctionLoader: acountAuctionLoader(),
        auctionOrdersLoader: auctionOrdersLoader(),
      }),
    }),
    RedisModule.register([
      {
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: 0,
      },
      {
        name: cacheConfig.auctionsRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.auctionsDbName,
      },
      {
        name: cacheConfig.ordersRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.ordersDbName,
      },
      {
        name: cacheConfig.assetsRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.assetsDbName,
      },
    ]),
    ScheduleModule.forRoot(),
    ConfigModule,
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
