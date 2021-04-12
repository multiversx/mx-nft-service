import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerInterceptor } from './interceptors/logger-interceptor';
import {
  utilities as nestWinstonModuleUtilities,
  WinstonModule,
} from 'nest-winston';
import * as winston from 'winston';
import * as Transport from 'winston-transport';
import { ScheduleModule } from '@nestjs/schedule';
import { ServicesModule } from './common/services';
import { NftModule } from './modules/nfts/nft.module';
import { GraphQLModule } from '@nestjs/graphql';

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
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WinstonModule.forRoot({
      transports: logTransports,
    }),
    GraphQLModule.forRoot({
      autoSchemaFile: 'schema.gql',
      sortSchema: true,
    }),
    ScheduleModule.forRoot(),
    ConfigModule,
    NftModule,
    ServicesModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerInterceptor,
    },
    LoggerInterceptor,
  ],
})
export class AppModule {}
