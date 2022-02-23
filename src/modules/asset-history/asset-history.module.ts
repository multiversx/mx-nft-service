import { Module } from '@nestjs/common';
import { AssetsHistoryResolver, AssetsHistoryService } from '.';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AssetHistoryAccountResolver } from './asset-history-account-resolver';
import { AccountsProvider } from '../account-stats/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/accounts.redis-handler';

@Module({
  providers: [
    AssetsHistoryService,
    AssetsHistoryResolver,
    AssetHistoryAccountResolver,
    RedisCacheService,
    AccountsProvider,
    AccountsRedisHandler,
  ],
  imports: [ElrondCommunicationModule],
  exports: [RedisCacheService],
})
export class AssetHistoryModuleGraph {}
