import { Logger, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import {
  ElrondCachingModule,
  RedisCacheModuleOptions,
} from '@multiversx/sdk-nestjs';
import { ConfigService } from '@nestjs/config';
import { ApiConfigService } from '../common/api-config/api.config.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET_KEY,
    }),
    ElrondCachingModule.forRoot(
      new RedisCacheModuleOptions({
        host: process.env.REDIS_URL,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      }),
    ),
  ],
  providers: [ApiConfigService, ConfigService, Logger],
  exports: [PassportModule, ApiConfigService, Logger],
})
export class AuthModule {}
