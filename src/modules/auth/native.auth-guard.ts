import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { CacheService } from '@multiversx/sdk-nestjs-cache';
import { Injectable, CanActivate, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiConfigService } from '../common/api-config/api.config.service';
import { AuthUtils } from './auth.utils';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly logger: Logger;
  private readonly authServer: NativeAuthServer;

  constructor(apiConfigService: ApiConfigService, private readonly cacheService: CacheService) {
    this.logger = new Logger(NativeAuthGuard.name);
    this.authServer = new NativeAuthServer({
      apiUrl: apiConfigService.getApiUrl(),
      maxExpirySeconds: apiConfigService.getNativeAuthMaxExpirySeconds(),
      acceptedOrigins: apiConfigService.getNativeAuthAcceptedOrigins(),
      cache: {
        getValue: async <T>(key: string): Promise<T | undefined> => {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }
          return await this.cacheService.get<T>(key);
        },
        setValue: async <T>(key: string, value: T, ttl: number): Promise<void> => {
          await this.cacheService.set(key, value, ttl);
        },
      },
      extraRequestHeaders: { origin: 'NftService' },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request = context.switchToHttp().getRequest();
    if (!request) {
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    }

    if (AuthUtils.bypassAuthorizationOnTestnet(request)) {
      return true;
    }

    const authorization: string = request.headers['authorization'];

    console.log({ authorization });

    const origin = request.headers['origin'];
    console.log({ origin });

    if (!authorization) {
      throw new UnauthorizedException();
    }
    const jwt = authorization.replace('Bearer ', '');

    console.log({ jwt });
    try {
      const userInfo = await this.authServer.validate(jwt);
      if (origin && origin !== userInfo.origin && origin !== 'https://' + userInfo.origin) {
        this.logger.log('Unhandled auth origin: ', {
          origin,
          tokenOrigin: userInfo.origin,
        });
      }

      console.log({ userInfo });
      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set('X-Native-Auth-Timestamp', Math.round(new Date().getTime() / 1000));

      request.auth = userInfo;

      console.log(111111111, userInfo);
      return true;
    } catch (error: any) {
      return false;
    }
  }
}
