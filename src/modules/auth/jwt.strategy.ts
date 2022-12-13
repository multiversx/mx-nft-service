import { NativeAuthServer } from '@elrondnetwork/native-auth-server';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ApiConfigService } from 'src/utils/api.config.service';
import { CachingService } from '@elrondnetwork/erdnest';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly authServer: NativeAuthServer;
  constructor(
    apiConfigService: ApiConfigService,
    cachingService: CachingService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
    });

    this.logger = new Logger(JwtStrategy.name);
    this.authServer = new NativeAuthServer({
      apiUrl: apiConfigService.getApiUrl(),
      cache: {
        getValue: async function <T>(key: string): Promise<T | undefined> {
          if (key === 'block:timestamp:latest') {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            return new Date().getTime() / 1000;
          }
          return await cachingService.getCache(key);
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

  async authenticate(req: any) {
    if (
      (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test' ||
        process.env.NODE_ENV === 'staging') &&
      !!req.headers['x-nft-address']
    ) {
      return this.bypassAuthorizationForTestnetEnv(req);
    }

    const authorization: string = req.headers['authorization'];
    if (!authorization) {
      throw new UnauthorizedException();
    }
    const jwt = authorization.replace('Bearer ', '');
    try {
      const userInfo = await this.authServer.validate(jwt);
      req.nativeAuth = userInfo;

      this.success(userInfo);
      return;
    } catch (error) {
      if (error?.message !== 'Invalid block hash') {
        this.logger.log(`Could not authorize or decode token: '${jwt}'`);
      }

      this.logger.log('Native auth failed :', error);
    }
    super.authenticate(req, {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET_KEY,
      signOptions: {
        expiresIn: `${process.env.JWT_TOKEN_EXPIRE_SECONDS}s`,
      },
    });
  }

  private bypassAuthorizationForTestnetEnv(req: any) {
    const address = req.headers['x-nft-address'];
    const user = {
      publicKey: address,
    };
    this.success(user);
    return;
  }

  async validate(payload: any): Promise<any> {
    const { user } = payload;

    const { address } = user;

    return {
      publicKey: address,
      address: address,
      issued: '',
      expires: process.env.JWT_TOKEN_EXPIRE_SECONDS,
    };
  }
}
