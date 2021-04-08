import { Module } from '@nestjs/common';
import { ElrondProxyService } from './elrond-proxy.service';
import { NonceService } from './nonce.service';
import { RedisModule } from 'nestjs-redis';
import { CacheManagerModule } from '../cache-manager/cache-manager.module';

@Module({
  providers: [ElrondProxyService, NonceService],
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
  exports: [ElrondProxyService, NonceService],
})
export class ElrondCommunicationModule {}
