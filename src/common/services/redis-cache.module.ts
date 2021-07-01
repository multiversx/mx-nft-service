import { DynamicModule, Module } from '@nestjs/common';
import { RedisModule, RedisModuleOptions } from 'nestjs-redis';
import { RedisCacheService } from './redis-cache.service';
@Module({})
export class RedisCacheModule {
  static register(options: RedisModuleOptions): DynamicModule {
    if (options?.password == '') {
      delete options['password'];
    }
    return {
      imports: [RedisModule.register(options)],
      module: RedisCacheModule,
      providers: [RedisCacheService],
      exports: [RedisCacheService],
    };
  }
}
