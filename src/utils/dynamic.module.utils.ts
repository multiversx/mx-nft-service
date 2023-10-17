import { DynamicModule, Provider } from '@nestjs/common';
import { ElasticModule, ElasticModuleOptions } from '@multiversx/sdk-nestjs-elastic';
import { ApiModule, ApiService, ApiModuleOptions } from '@multiversx/sdk-nestjs-http';
import { CacheModule, RedisCacheModuleOptions, RedisCacheModule } from '@multiversx/sdk-nestjs-cache';
import { ClientOptions, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ApiConfigModule } from 'src/modules/common/api-config/api.config.module';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';

export class DynamicModuleUtils {
  static getElasticModule(): DynamicModule {
    return ElasticModule.forRootAsync({
      useFactory: (apiConfigService: ApiConfigService) =>
        new ElasticModuleOptions({
          url: apiConfigService.getElasticUrl(),
          customValuePrefix: 'nft',
        }),
      inject: [ApiConfigService, ApiService],
    });
  }

  static getApiModule(): DynamicModule {
    return ApiModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        new ApiModuleOptions({
          axiosTimeout: apiConfigService.getAxiosTimeout(),
          rateLimiterSecret: apiConfigService.getRateLimiterSecret(),
          serverTimeout: apiConfigService.getServerTimeout(),
          useKeepAliveAgent: apiConfigService.getUseKeepAliveAgentFlag(),
        }),
      inject: [ApiConfigService],
    });
  }

  static getCacheModule(): DynamicModule {
    return CacheModule.forRootAsync(
      {
        imports: [ApiConfigModule],
        useFactory: (apiConfigService: ApiConfigService) =>
          new RedisCacheModuleOptions({
            host: apiConfigService.getRedisUrl(),
            port: apiConfigService.getRedisPort(),
          }),
        inject: [ApiConfigService],
      },
      {
        skipItemsSerialization: false,
      },
    );
  }

  static getRedisModule(): DynamicModule {
    return RedisCacheModule.forRootAsync({
      imports: [ApiConfigModule],
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
