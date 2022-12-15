import { Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import {
  CachingService,
  CachingModuleOptions,
  LocalCacheService,
  MetricsService,
} from '@elrondnetwork/erdnest';
import { ConfigService } from '@nestjs/config';
import { ApiConfigService } from '../common/api-config/api.config.service';
import { DynamicModuleUtils } from 'src/utils/dynamicModule-utils';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
    DynamicModuleUtils.getCachingModule(),
  ],
  providers: [ApiConfigService, ConfigService, Logger],
  exports: [PassportModule, ApiConfigService, Logger],
})
export class AuthModule {}
