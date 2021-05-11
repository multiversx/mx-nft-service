import { CacheModule, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { CacheManagerModule } from '../../common/services/cache-manager/cache-manager.module';
import * as redisStore from 'cache-manager-redis-store';
import { AssetsService } from './assets.service';
import { AssetsResolver } from './assets.resolver';
import { AssetsModuleDb } from 'src/db/assets/assets.module';
import { AccountsModuleGraph } from '../accounts/accounts.module';

@Module({
  providers: [AssetsService, AssetsResolver],
  imports: [
    ElrondCommunicationModule,
    CacheManagerModule,
    AssetsModuleDb,
    AccountsModuleGraph,
    CacheModule.register({
      ttl: 30, // default cache to 30 seconds. it will be overridden when needed
      store: redisStore,
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      prefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [AssetsService],
})
export class AssetsModuleGraph {}
