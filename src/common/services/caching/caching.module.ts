import { forwardRef, Global, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { DynamicModuleUtils } from 'src/utils/dynamic.module.utils';
import { LocalRedisCacheService } from './local-redis-cache.service';

@Global()
@Module({
  imports: [forwardRef(() => CommonModule), DynamicModuleUtils.getRedisModule(), DynamicModuleUtils.getCacheModule()],
  providers: [LocalRedisCacheService],
  exports: [LocalRedisCacheService, DynamicModuleUtils.getRedisModule()],
})
export class CacheModule {}
