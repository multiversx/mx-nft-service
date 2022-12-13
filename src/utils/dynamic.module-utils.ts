import { ERDNEST_CONFIG_SERVICE } from '@elrondnetwork/erdnest';
import { Provider } from '@nestjs/common';
import { ErdnestConfigServiceImpl } from './erdnest.config.service.implementation';

export class DynamicModuleUtils {
  static getNestJsApiConfigService(): Provider {
    return {
      provide: ERDNEST_CONFIG_SERVICE,
      useClass: ErdnestConfigServiceImpl,
    };
  }
}
