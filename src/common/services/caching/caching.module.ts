import {
  CachingModuleOptions,
  LocalCacheService,
} from '@multiversx/sdk-nestjs';
import { forwardRef, Global, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { LocalRedisCacheService } from './local-redis-cache.service';

@Global()
@Module({
  imports: [
    forwardRef(() => CommonModule),

    DynamicModuleUtils.getCachingModule(),
    DynamicModuleUtils.getRedisModule(),
  ],
  providers: [LocalRedisCacheService, LocalCacheService, CachingModuleOptions],
  exports: [
    LocalCacheService,
    LocalRedisCacheService,
    DynamicModuleUtils.getRedisModule(),
    DynamicModuleUtils.getCachingModule(),
    CachingModuleOptions,
  ],
})
export class CacheModule {}
