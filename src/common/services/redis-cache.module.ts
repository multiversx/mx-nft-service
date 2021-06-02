import {
  CacheModule,
  CacheModuleOptions,
  DynamicModule,
  Module,
} from '@nestjs/common';
import * as redisStore from 'cache-manager-redis-store';
import { RedisCacheService } from './redis-cache.service';

@Module({})
export class RedisCacheModule {
  static register(options: CacheModuleOptions): DynamicModule {

    if (options?.password == '') {
      delete options['password'];
    }

    return {
      imports: [
        CacheModule.register({
          ...options,
          store: redisStore
        })
      ],
      module: RedisCacheModule,
      providers: [RedisCacheService],
      exports: [RedisCacheService],
    };
  }
}
