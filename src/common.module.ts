import { forwardRef, Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config/dist';
import { ScheduleModule } from '@nestjs/schedule';
import { RedisModule } from 'nestjs-redis';
import { ElrondCommunicationModule } from './common/services/elrond-communication/elrond-communication.module';
import { cacheConfig } from './config';
import { CachingModule } from './common/services/caching/caching.module';
import { ApiConfigService } from './utils/api.config.service';

@Module({
  imports: [
    forwardRef(() => CachingModule),
    ScheduleModule.forRoot(),
    ConfigModule,

    RedisModule.register([
      {
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: 0,
      },
      {
        clientName: cacheConfig.auctionsRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.auctionsDbName,
      },
      {
        clientName: cacheConfig.ordersRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.ordersDbName,
      },
      {
        clientName: cacheConfig.assetsRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.assetsDbName,
      },
      {
        clientName: cacheConfig.persistentRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.persistentDbName,
      },
      {
        clientName: cacheConfig.collectionsRedisClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.collectionsDbName,
      },
      {
        clientName: cacheConfig.rarityQueueClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.rarityQueueDbName,
      },
      {
        clientName: cacheConfig.traitsQueueClientName,
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        db: cacheConfig.traitsQueueDbName,
      },
    ]),
    ElrondCommunicationModule,
  ],
  exports: [ElrondCommunicationModule, CachingModule, ApiConfigService],
  providers: [ApiConfigService],
})
export class CommonModule {}
