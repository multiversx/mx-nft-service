import {
  CacheModule,
  Module,
} from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { RedisCacheService } from './redis-cache.service';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: () => {
        return {
          store: redisStore,
          host: process.env.REDIS_URL,
          port: process.env.REDIS_PORT,
          password: process.env.REDIS_PASSWORD,
          db: 1,
        };
      },
    }),
  ],
  exports: [
    RedisCacheService
  ],
  providers: [
    RedisCacheService
  ]
})
export class RedisCacheModule { }
