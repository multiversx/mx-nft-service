import { Module } from '@nestjs/common';
import { MxCommunicationModule } from 'src/common/services/mx-communication';
import { UsdPriceService } from './usd-price.service';
import { UsdPriceRedisHandler } from './usd-price.redis-handler';
import { UsdPriceResolver } from './usd-price.resolver';
import { UsdTokenPriceResolver } from './usd-token-price.resolver';

@Module({
  providers: [
    UsdPriceResolver,
    UsdTokenPriceResolver,
    UsdPriceRedisHandler,
    UsdPriceService,
  ],
  imports: [MxCommunicationModule],
  exports: [UsdPriceService],
})
export class UsdPriceModuleGraph {}
