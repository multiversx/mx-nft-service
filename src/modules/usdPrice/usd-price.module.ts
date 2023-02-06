import { Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common/services/mx-communication';
import { UsdPriceService } from './usd-price.service';
import { UsdPriceRedisHandler } from './usd-price.redis-handler';
import { UsdPriceResolver } from './usd-price.resolver';
import { UsdTokenPriceResolver } from './usd-token-price.resolver';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import {
  RedisCacheModule,
  RedisCacheModuleOptions,
} from '@multiversx/sdk-nestjs';

@Module({
  providers: [
    UsdPriceResolver,
    UsdTokenPriceResolver,
    UsdPriceRedisHandler,
    UsdPriceService,
  ],
  imports: [
    MxCommunicationModule,
    RedisCacheModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
      }),
    ),
  ],
  exports: [UsdPriceService],
})
export class UsdPriceModuleGraph {}
