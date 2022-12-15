import {
  forwardRef,
  Global,
  Logger,
  Module,
  CacheModule,
} from '@nestjs/common';
import { CommonModule } from 'src/common.module';
import { CachingService } from './caching.service';
import { LocalCacheService } from './local.cache.service';
import { RedisCacheService } from './redis-cache.service';

@Global()
@Module({
  imports: [
    forwardRef(() => CommonModule),
    CacheModule.register({
      host: process.env.REDIS_URL,
      port: parseInt(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
    }),
  ],
  providers: [Logger, CachingService, LocalCacheService, RedisCacheService],
  exports: [CachingService, LocalCacheService, RedisCacheService],
})
export class CachingModule {}
