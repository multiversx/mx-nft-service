import { CacheModule, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { CacheManagerModule } from '../../common/services/cache-manager/cache-manager.module';
import * as redisStore from 'cache-manager-redis-store';
import { AccountsResolver } from './accounts.resolver';
import { AccountsService } from './accounts.service';
import { AccountsModuleDb } from '../../db/accounts/accounts.module'
import { FollowersModuleDb } from 'src/db/followers/followers.module';

@Module({
  providers: [AccountsService, AccountsResolver],
  imports: [
    ElrondCommunicationModule,
    AccountsModuleDb,
    FollowersModuleDb,
    CacheManagerModule,
    CacheModule.register({
      ttl: 30,
      store: redisStore,
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      prefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [AccountsService],
})
export class AccountsModuleGraph { }

