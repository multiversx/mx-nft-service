import {
  CachingModuleOptions,
  CachingService,
  ElrondCachingModule,
  LocalCacheService,
  RedisCacheModuleOptions,
  RedisCacheService,
} from '@elrondnetwork/erdnest';
import { forwardRef, Global, Logger, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { LocalRedisCacheService } from './local-redis-cache.service';

@Global()
@Module({
  imports: [
    forwardRef(() => CommonModule),
    ElrondCachingModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),
  ],
  providers: [
    Logger,
    CachingService,
    LocalCacheService,
    RedisCacheService,
    LocalRedisCacheService,
    CachingModuleOptions,
  ],
  exports: [
    CachingService,
    LocalCacheService,
    RedisCacheService,
    LocalRedisCacheService,
    CachingModuleOptions,
  ],
})
export class CachingModule {}
