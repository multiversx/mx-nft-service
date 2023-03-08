import { Global, Module } from '@nestjs/common';
import { ApiConfigService } from './api.config.service';
import { ConfigService } from '@nestjs/config';

@Global()
@Module({
  providers: [ApiConfigService, ConfigService],
  exports: [ApiConfigService, ConfigService],
})
export class ApiConfigModule {}
