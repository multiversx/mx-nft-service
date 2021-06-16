import { Module } from '@nestjs/common';
import { ElrondProxyService } from './elrond-proxy.service';
import { RedisModule } from 'nestjs-redis';
import { ElrondApiService } from './elrond-api.service';

@Module({
  providers: [ElrondProxyService, ElrondApiService],
  imports: [
    RedisModule.register({
      host: process.env.REDIS_URL,
      port: parseInt(process.env.REDIS_PORT),
      db: parseInt(process.env.REDIS_DB),
      password: process.env.REDIS_PASSWORD,
      keyPrefix: process.env.REDIS_PREFIX,
    }),
  ],
  exports: [ElrondProxyService, ElrondApiService],
})
export class ElrondCommunicationModule {}
