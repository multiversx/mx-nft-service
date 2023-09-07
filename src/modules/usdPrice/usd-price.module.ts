import { Module } from '@nestjs/common';
import { UsdPriceService } from './usd-price.service';
import { UsdPriceRedisHandler } from './usd-price.redis-handler';
import { UsdPriceResolver } from './usd-price.resolver';
import { UsdTokenPriceResolver } from './usd-token-price.resolver';
import { CommonModule } from 'src/common.module';

@Module({
  providers: [UsdPriceResolver, UsdTokenPriceResolver, UsdPriceRedisHandler, UsdPriceService],
  imports: [CommonModule],
  exports: [UsdPriceService],
})
export class UsdPriceModuleGraph {}
