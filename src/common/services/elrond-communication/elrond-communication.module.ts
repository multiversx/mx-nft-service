import { Module } from '@nestjs/common';
import { ElrondApiService } from './elrond-api.service';
import { ElrondProxyService } from './elrond-proxy.service';
import { NonceService } from './nonce.service';
import { RedisModule } from 'nestjs-redis';
import { ElrondNodeService } from './elrond-node.service';
import { CacheManagerModule } from '../cache-manager/cache-manager.module';

@Module({
  providers: [
    ElrondApiService,
    ElrondProxyService,
    NonceService,
    ElrondNodeService,
  ],
  imports: [
    RedisModule.register({
      host: process.env.REDIS_URL,
      port: parseInt(process.env.REDIS_PORT),
      db: parseInt(process.env.REDIS_DB),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_PREFIX,
    }),
    CacheManagerModule,
  ],
  exports: [
    ElrondApiService,
    ElrondProxyService,
    NonceService,
    ElrondNodeService,
  ],
})
export class ElrondCommunicationModule {}
