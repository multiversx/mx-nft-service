import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { verify } from 'jsonwebtoken';
import { ApiConfigService } from 'src/utils/api.config.service';

@Injectable()
export class JwtAuthenticateGuard implements CanActivate {
  private readonly logger: Logger;

  constructor(private readonly apiConfigService: ApiConfigService) {
    this.logger = new Logger(JwtAuthenticateGuard.name);
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
      console.log(111111111);
      return true;
    }
    const authorization: string = request.headers['authorization'];
    if (!authorization) {
      return false;
    }

    const jwt = authorization.replace('Bearer ', '');

    try {
      const jwtSecret = this.apiConfigService.getJwtSecret();

      request.jwt = await new Promise((resolve, reject) => {
        verify(jwt, jwtSecret, (err, decoded) => {
          if (err) {
            reject(err);
          }

          request.auth = {
            address: decoded.sub,
            expires: decoded.exp,
            issued: decoded.iat,
            host: decoded.iss,
          };
          resolve(request.auth);
        });
      });
    } catch (error) {
      this.logger.error(error);
      return false;
    }

    return true;
  }
}
