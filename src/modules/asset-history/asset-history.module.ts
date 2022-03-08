import { Module } from '@nestjs/common';
import { AssetsHistoryResolver, AssetsHistoryService } from '.';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { AssetHistoryAccountResolver } from './asset-history-account-resolver';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';

@Module({
  providers: [
    AssetsHistoryService,
    AssetsHistoryResolver,
    AssetHistoryAccountResolver,
    LocalCacheService,
    RedisCacheService,
    AccountsProvider,
    AccountsRedisHandler,
  ],
  imports: [ElrondCommunicationModule],
  exports: [RedisCacheService],
})
export class AssetHistoryModuleGraph {}
