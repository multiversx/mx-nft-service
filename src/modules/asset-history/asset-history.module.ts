import { forwardRef, Module } from '@nestjs/common';
import { AssetsHistoryResolver, AssetsHistoryService } from '.';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { PriceServiceUSD } from '../Price.service.usd';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';

@Module({
  providers: [
    AssetsHistoryService,
    AssetsHistoryResolver,
    PriceServiceUSD,
    RedisCacheService,
  ],
  imports: [ElrondCommunicationModule, forwardRef(() => AccountsModuleGraph)],
  exports: [RedisCacheService],
})
export class AssetHistoryModuleGraph {}
