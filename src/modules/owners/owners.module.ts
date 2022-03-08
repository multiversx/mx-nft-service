import { Module } from '@nestjs/common';
import { OwnersService } from './owners.service';
import { ElrondCommunicationModule, RedisCacheService } from 'src/common';
import { OwnersResolver } from './owners.resolver';
import { AccountsProvider } from '../account-stats/loaders/accounts.loader';
import { AccountsRedisHandler } from '../account-stats/loaders/accounts.redis-handler';
import { LocalCacheService } from 'src/common/services/caching/local.cache.service';

@Module({
  providers: [
    OwnersService,
    OwnersResolver,
    AccountsRedisHandler,
    LocalCacheService,
    AccountsProvider,
    RedisCacheService,
  ],
  imports: [ElrondCommunicationModule],
  exports: [OwnersService, AccountsRedisHandler, AccountsProvider],
})
export class OwnersModuleGraph {}
