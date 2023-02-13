import {
  CachingModule,
  CachingModuleOptions,
  RedisCacheModule,
  RedisCacheModuleOptions,
} from '@multiversx/sdk-nestjs';
import { DynamicModule } from '@nestjs/common';

export class DynamicModuleUtils {
  static getCachingModule(): DynamicModule {
    return CachingModule.forRootAsync({
      useFactory: () =>
        new CachingModuleOptions({
          url: process.env.REDIS_URL,
          port: parseInt(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
        }),
    });
  }

  static getRedisModule(): DynamicModule {
    console.log(
      1111111111,
      process.env.REDIS_URL,
      parseInt(process.env.REDIS_PORT),
    );
    return RedisCacheModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    );
  }
}
