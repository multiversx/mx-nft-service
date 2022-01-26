import { forwardRef, Module } from '@nestjs/common';
import { AssetsHistoryResolver, AssetsHistoryService } from '.';
import { AccountsModuleGraph } from '../accounts/accounts.module';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AssetHistoryAccountResolver } from './asset-history-account-resolver';

@Module({
  providers: [
    AssetsHistoryService,
    AssetsHistoryResolver,
    AssetHistoryAccountResolver,
    RedisCacheService,
  ],
  imports: [ElrondCommunicationModule, forwardRef(() => AccountsModuleGraph)],
  exports: [RedisCacheService],
})
export class AssetHistoryModuleGraph {}
