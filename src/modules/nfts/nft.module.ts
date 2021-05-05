import { CacheModule, Module } from '@nestjs/common';
import { ElrondCommunicationModule } from '../../common/services/elrond-communication/elrond-communication.module';
import { NftService } from './nft.service';
import { CacheManagerModule } from '../../common/services/cache-manager/cache-manager.module';
import * as redisStore from 'cache-manager-redis-store';

@Module({
  providers: [NftService],
  imports: [
    ElrondCommunicationModule,
    CacheManagerModule,
    CacheModule.register({
      ttl: 30, // default cache to 30 seconds. it will be overridden when needed
      store: redisStore,
      host: process.env.REDIS_URL,
      port: process.env.REDIS_PORT,
      prefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [NftService],
})
export class NftModule {}
