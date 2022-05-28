import { forwardRef, Module } from '@nestjs/common';
import { AssetsHistoryResolver, AssetsHistoryService } from '.';
import { ElrondCommunicationModule } from 'src/common';
import { AssetHistoryAccountResolver } from './asset-history-account-resolver';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';

@Module({
  providers: [
    AssetsHistoryService,
    AssetsHistoryResolver,
    AssetHistoryAccountResolver,
    AccountsProvider,
    AccountsRedisHandler,
  ],
  imports: [forwardRef(() => ElrondCommunicationModule)],
})
export class AssetHistoryModuleGraph {}
