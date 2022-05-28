import { forwardRef, Global, Module } from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CachingService } from './caching.service';
import { LocalCacheService } from './local.cache.service';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  imports: [forwardRef(() => CommonModule)],
  providers: [CachingService, LocalCacheService, RedisCacheService],
  exports: [CachingService, LocalCacheService, RedisCacheService],
})
export class CachingModule {}
