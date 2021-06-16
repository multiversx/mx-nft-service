import { Module } from '@nestjs/common';
import { RedlockService } from './redlock';
import { RedisModule } from 'nestjs-redis';

@Module({
  providers: [RedlockService],
  exports: [RedlockService],
  imports: [
    RedisModule.register({
      host: process.env.REDIS_URL,
      port: parseInt(process.env.REDIS_PORT || '6379'),
      keyPrefix: process.env.REDIS_PREFIX,
    }),
  ],
})
export class ServicesModule {}
