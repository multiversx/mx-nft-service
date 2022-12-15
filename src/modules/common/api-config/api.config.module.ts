import { Global, Module } from '@nestjs/common';
import { ApiConfigService } from './api.config.service';

@Global()
@Module({
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class ApiConfigModule {}
