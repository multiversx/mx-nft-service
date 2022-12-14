import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { ErdnestConfigServiceImpl } from 'src/utils/erdnest.config.service.implementation';
import { ApiConfigService } from 'src/utils/api.config.service';
import {
  CachingService,
  CachingModuleOptions,
  LocalCacheService,
  MetricsService,
} from '@elrondnetwork/erdnest';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
  ],
  providers: [
    JwtStrategy,
    ErdnestConfigServiceImpl,
    ApiConfigService,
    CachingService,
    CachingModuleOptions,
    LocalCacheService,
    MetricsService,
  ],
  exports: [
    PassportModule,
    ErdnestConfigServiceImpl,
    ApiConfigService,
    CachingService,
    CachingModuleOptions,
    LocalCacheService,
    MetricsService,
  ],
})
export class AuthModule {}
