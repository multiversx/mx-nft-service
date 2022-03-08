import { Module } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication';
import { UsdPriceLoader } from './loaders/usd-price.loader';
import { UsdPriceRedisHandler } from './loaders/usd-price.redis-handler';
import { UsdAmountResolver } from './usd-amount.resolver';

@Module({
  providers: [
    UsdAmountResolver,
    UsdPriceRedisHandler,
    UsdPriceLoader,
    RedisCacheService,
  ],
  imports: [ElrondCommunicationModule],
})
export class UsdAmountModuleGraph {}
