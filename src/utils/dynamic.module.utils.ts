import {
  CachingModule,
  CachingModuleOptions,
  RedisCacheModule,
  RedisCacheModuleOptions,
} from '@multiversx/sdk-nestjs';
import { DynamicModule, Provider } from '@nestjs/common';
import {
  ClientOptions,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';

export class DynamicModuleUtils {
  static getCachingModule(): DynamicModule {
    return CachingModule.forRootAsync({
      useFactory: (apiConfigService: ApiConfigService) =>
        new CachingModuleOptions({
          url: apiConfigService.getRedisUrl(),
          port: apiConfigService.getRedisPort(),
        }),
      inject: [ApiConfigService],
    });
  }
  static getRedisModule(): DynamicModule {
    return RedisCacheModule.forRootAsync({
      useFactory: (apiConfigService: ApiConfigService) =>
        new RedisCacheModuleOptions({
          host: apiConfigService.getRedisUrl(),
          port: apiConfigService.getRedisPort(),
        }),
      inject: [ApiConfigService],
    });
  }

  static getPubSubService(): Provider {
    return {
      provide: 'PUBSUB_SERVICE',
      useFactory: (apiConfigService: ApiConfigService) => {
        const clientOptions: ClientOptions = {
          transport: Transport.REDIS,
          options: {
            host: apiConfigService.getRedisUrl(),
            port: apiConfigService.getRedisPort(),
            retryDelay: 1000,
            retryAttempts: 10,
            retryStrategy: () => 1000,
          },
        };

        return ClientProxyFactory.create(clientOptions);
      },
      inject: [ApiConfigService],
    };
  }
}
