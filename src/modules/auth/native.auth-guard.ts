import { CachingService } from '@elrondnetwork/erdnest';
import { NativeAuthServer } from '@elrondnetwork/native-auth-server';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ApiConfigService } from 'src/utils/api.config.service';

@Injectable()
export class NativeAuthGuard implements CanActivate {
  private readonly logger: Logger;
  private readonly authServer: NativeAuthServer;

  constructor(
    apiConfigService: ApiConfigService,
    cachingService: CachingService,
  ) {
    this.logger = new Logger(NativeAuthGuard.name);
    this.authServer = new NativeAuthServer({
      apiUrl: apiConfigService.getApiUrl(),
      cache: {
        getValue: async function <T>(key: string): Promise<T | undefined> {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }

          return await cachingService.getCache<T>(key);
        },
        setValue: async function <T>(
          key: string,
          value: T,
          ttl: number,
        ): Promise<void> {
          await cachingService.setCache(key, value, ttl);
        },
      },
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let request = context.switchToHttp().getRequest();
    if (!request) {
      const ctx = GqlExecutionContext.create(context);
      request = ctx.getContext().req;
    }

    if (
      (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test') &&
      !!request.headers['x-nft-address']
    ) {
      const address = request.headers['x-nft-address'];
      request.auth = {
        address: address,
      };
      return true;
    }

    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const jwt = authorization.replace('Bearer ', '');

    try {
      const userInfo = await this.authServer.validate(jwt);

      request.res.set('X-Native-Auth-Issued', userInfo.issued);
      request.res.set('X-Native-Auth-Expires', userInfo.expires);
      request.res.set('X-Native-Auth-Address', userInfo.address);
      request.res.set(
        'X-Native-Auth-Timestamp',
        Math.round(new Date().getTime() / 1000),
      );

      request.auth = userInfo;

      return true;
    } catch (error: any) {
      this.logger.error(error);
      return false;
    }
  }
}
