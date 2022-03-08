import { Module } from '@nestjs/common';
import { RedisCacheService } from 'src/common';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication';
import { UsdPriceLoader } from './loaders/usd-price.loader';
import { UsdPriceRedisHandler } from './loaders/usd-price.redis-handler';
import { UsdAmountResolver } from './usd-amount.resolver';

@Module({
  providers: [
    UsdAmountResolver,
    UsdPriceRedisHandler,
    UsdPriceLoader,
    LocalCacheService,
    RedisCacheService,
  ],
  imports: [ElrondCommunicationModule],
})
export class UsdAmountModuleGraph {}
