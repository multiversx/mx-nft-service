import { Module } from '@nestjs/common';
import { CollectionsResolver } from './collection.resolver';
import { CollectionsService } from './collection.service';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { ElrondCommunicationModule } from 'src/common';

@Module({
  providers: [
    CollectionsService,
    CollectionsResolver,
    AccountsRedisHandler,
    AccountsProvider,
  ],
  imports: [ElrondCommunicationModule],
})
export class CollectionModuleGraph {}
