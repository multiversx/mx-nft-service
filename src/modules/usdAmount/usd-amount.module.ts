import { Module } from '@nestjs/common';
import { ElrondCommunicationModule } from 'src/common/services/elrond-communication';
import { UsdPriceService } from './loaders/usd-price.service';
import { UsdPriceRedisHandler } from './loaders/usd-price.redis-handler';
import { UsdAmountResolver } from './usd-amount.resolver';

@Module({
  providers: [UsdAmountResolver, UsdPriceRedisHandler, UsdPriceService],
  imports: [ElrondCommunicationModule],
})
export class UsdAmountModuleGraph {}
