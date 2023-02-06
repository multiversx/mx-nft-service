import { CachingModule, CachingModuleOptions } from '@multiversx/sdk-nestjs';
import { DynamicModule } from '@nestjs/common';
import { ApiConfigModule } from 'src/modules/common/api-config/api.config.module';
import { ApiConfigService } from 'src/modules/common/api-config/api.config.service';

export class DynamicModuleUtils {
  static getCachingModule(): DynamicModule {
    return CachingModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: () =>
        new CachingModuleOptions({
          url: process.env.REDIS_URL,
          port: parseInt(process.env.REDIS_PORT),
          password: process.env.REDIS_PASSWORD,
        }),
      inject: [ApiConfigService],
    });
  }
}
