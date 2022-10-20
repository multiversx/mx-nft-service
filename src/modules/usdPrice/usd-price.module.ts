import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication';
import { UsdPriceService } from './usd-price.service';
import { UsdPriceRedisHandler } from './usd-price.redis-handler';
import { UsdPriceResolver } from './usd-price.resolver';

@Module({
  providers: [UsdPriceResolver, UsdPriceRedisHandler, UsdPriceService],
  imports: [ElrondCommunicationModule],
  exports: [UsdPriceService],
})
export class UsdPriceModuleGraph {}
