import { CachingModule, CachingModuleOptions } from '@elrondnetwork/erdnest';
import { DynamicModule } from '@nestjs/common';
import { ApiConfigModule } from 'src/modules/common/api-config/api.config.module';
import { ApiConfigService } from '../modules/common/api-config/api.config.service';

export class DynamicModuleUtils {
  static getCachingModule(): DynamicModule {
    return CachingModule.forRootAsync({
      imports: [ApiConfigModule],
      useFactory: (apiConfigService: ApiConfigService) =>
        new CachingModuleOptions({
          url: apiConfigService.getRedisUrl(),
        }),
      inject: [ApiConfigService],
    });
  }
}
