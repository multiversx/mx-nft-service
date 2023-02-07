import {
  CachingModule,
  CachingModuleOptions,
  ElrondCachingModule,
  LocalCacheService,
  RedisCacheModule,
  RedisCacheModuleOptions,
} from '@multiversx/sdk-nestjs';
import { forwardRef, Global, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { LocalRedisCacheService } from './local-redis-cache.service';

@Global()
@Module({
  imports: [
    forwardRef(() => CommonModule),
    RedisCacheModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),
    ElrondCachingModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),
    CachingModule.forRoot(
      new CachingModuleOptions({
        url: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),
  ],
  providers: [LocalRedisCacheService, LocalCacheService, CachingModuleOptions],
  exports: [
    LocalCacheService,
    LocalRedisCacheService,
    ElrondCachingModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),

    RedisCacheModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),
    CachingModule.forRoot(
      new CachingModuleOptions({
        url: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),
    CachingModuleOptions,
  ],
})
export class CacheModule {}
