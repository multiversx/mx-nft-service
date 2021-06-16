import { CacheModule, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import * as redisStore from 'cache-manager-redis-store';
import { TokensResolver } from './tokens.resolver';
import { TokensService } from './tokens.service';
import { AssetsModuleGraph } from '../assets/assets.module';

@Module({
  providers: [TokensService, TokensResolver],
  imports: [
    ElrondCommunicationModule,
    AssetsModuleGraph,
    CacheModule.register({
      ttl: 30, // default cache to 30 seconds. it will be overridden when needed
      store: redisStore,
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      prefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [TokensService],
})
export class TokensModuleGraph {}
