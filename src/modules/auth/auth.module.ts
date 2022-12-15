import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ApiConfigService } from 'src/utils/api.config.service';
import {
  CachingService,
  CachingModuleOptions,
  LocalCacheService,
  MetricsService,
} from '@elrondnetwork/erdnest';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
  ],
  providers: [
    ApiConfigService,
    CachingService,
    CachingModuleOptions,
    LocalCacheService,
    MetricsService,
    ConfigService,
  ],
  exports: [
    PassportModule,
    ApiConfigService,
    CachingService,
    CachingModuleOptions,
    LocalCacheService,
    MetricsService,
  ],
})
export class AuthModule {}
